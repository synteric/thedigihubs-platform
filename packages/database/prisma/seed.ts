import bcrypt from 'bcryptjs';
import {
  MembershipStatus,
  OrganizationStatus,
  OrganizationType,
  PlanKey,
  PrismaClient,
  RfqStatus,
  RoleKey,
  SupplierVerificationStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const legacyPlatformAdminEmail = 'admin@thedigihubs.com';
const platformAdminEmail = process.env.PLATFORM_ADMIN_EMAIL?.trim().toLowerCase() || 'support@thedigihubs.com';

const devPasswords = {
  admin: process.env.PLATFORM_ADMIN_PASSWORD || 'AdminPass123!',
  buyer: 'BuyerPass123!',
  supplier: 'SupplierPass123!',
};

const permissions = [
  ['platform.manage', 'Manage platform-wide settings and operations'],
  ['organizations.read', 'Read organizations'],
  ['organizations.manage', 'Create and update organizations'],
  ['users.manage', 'Manage users and memberships'],
  ['roles.manage', 'Manage roles and permissions'],
  ['plans.manage', 'Manage membership plans'],
  ['support.manage', 'Manage support tickets'],
  ['audit.read', 'Read audit logs'],
  ['rfqs.create', 'Create RFQs'],
  ['rfqs.read', 'Read RFQs'],
  ['rfqs.publish', 'Publish RFQs'],
  ['rfqs.evaluate', 'Evaluate RFQs'],
  ['suppliers.read', 'Read supplier marketplace data'],
  ['quotes.create', 'Create quotes'],
  ['quotes.read', 'Read quotes'],
  ['quotes.submit', 'Submit quotes'],
  ['dashboard.read', 'Read dashboard data'],
];

const rolePermissions: Record<RoleKey, string[]> = {
  PLATFORM_ADMIN: permissions.map(([key]) => key),
  PLATFORM_SUPPORT: ['organizations.read', 'support.manage', 'audit.read', 'rfqs.read', 'dashboard.read'],
  BUYER_OWNER: ['rfqs.create', 'rfqs.read', 'rfqs.publish', 'rfqs.evaluate', 'suppliers.read', 'quotes.read', 'users.manage', 'dashboard.read'],
  BUYER_MANAGER: ['rfqs.create', 'rfqs.read', 'rfqs.publish', 'rfqs.evaluate', 'suppliers.read', 'quotes.read', 'dashboard.read'],
  BUYER_EVALUATOR: ['rfqs.read', 'rfqs.evaluate', 'quotes.read', 'dashboard.read'],
  SUPPLIER_OWNER: ['rfqs.read', 'quotes.create', 'quotes.read', 'quotes.submit', 'users.manage', 'dashboard.read'],
  SUPPLIER_MANAGER: ['rfqs.read', 'quotes.create', 'quotes.read', 'quotes.submit', 'dashboard.read'],
  SUPPLIER_STAFF: ['rfqs.read', 'quotes.create', 'quotes.read', 'dashboard.read'],
  VIEWER: ['dashboard.read'],
};

const plans = [
  {
    key: PlanKey.STARTER,
    name: 'Starter',
    description: 'Entry plan for teams validating sourcing workflows.',
    features: ['basic_dashboard', 'supplier_search', 'limited_rfqs'],
  },
  {
    key: PlanKey.GROWTH,
    name: 'Growth',
    description: 'Growing procurement teams with collaboration needs.',
    features: ['basic_dashboard', 'supplier_search', 'rfq_creation', 'quote_comparison'],
  },
  {
    key: PlanKey.PROFESSIONAL,
    name: 'Professional',
    description: 'Full sourcing workflow for active buying and supplier teams.',
    features: ['basic_dashboard', 'supplier_search', 'rfq_creation', 'quote_comparison', 'supplier_matching', 'document_uploads'],
  },
  {
    key: PlanKey.ENTERPRISE,
    name: 'Enterprise',
    description: 'Advanced governance, controls, and marketplace administration.',
    features: ['basic_dashboard', 'supplier_search', 'rfq_creation', 'quote_comparison', 'supplier_matching', 'document_uploads', 'advanced_admin', 'audit_logs'],
  },
];

async function upsertRolesAndPermissions() {
  const permissionRecords = new Map<string, string>();

  for (const [key, description] of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    });
    permissionRecords.set(key, permission.id);
  }

  for (const roleKey of Object.values(RoleKey)) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      update: {
        name: roleKey.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' '),
      },
      create: {
        key: roleKey,
        name: roleKey.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' '),
      },
    });

    for (const permissionKey of rolePermissions[roleKey]) {
      const permissionId = permissionRecords.get(permissionKey);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }
}

async function assignPlan(organizationId: string, planKey: PlanKey) {
  const plan = await prisma.membershipPlan.findUniqueOrThrow({ where: { key: planKey } });
  await prisma.organizationPlanAssignment.upsert({
    where: { organizationId_planId: { organizationId, planId: plan.id } },
    update: { isActive: true, endsAt: null },
    create: { organizationId, planId: plan.id, isActive: true },
  });
}

async function upsertUserWithMembership({
  email,
  name,
  password,
  roleKey,
  organizationId,
  isDefault = true,
}: {
  email: string;
  name: string;
  password: string;
  roleKey: RoleKey;
  organizationId: string;
  isDefault?: boolean;
}) {
  const passwordHash = await bcrypt.hash(password, 12);
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      status: 'ACTIVE',
      role: roleKey,
      organizationId,
    },
    create: {
      email,
      name,
      passwordHash,
      status: 'ACTIVE',
      role: roleKey,
      organizationId,
    },
  });

  await prisma.organizationMembership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    update: {
      roleId: role.id,
      status: MembershipStatus.ACTIVE,
      isDefault,
    },
    create: {
      userId: user.id,
      organizationId,
      roleId: role.id,
      status: MembershipStatus.ACTIVE,
      isDefault,
    },
  });

  return user;
}

async function main() {
  await upsertRolesAndPermissions();

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { key: plan.key },
      update: {
        name: plan.name,
        description: plan.description,
        features: plan.features,
      },
      create: plan,
    });
  }

  const platform = await prisma.organization.upsert({
    where: { slug: 'thedigihubs-platform-admin' },
    update: {
      name: 'TheDigiHubs Platform Admin',
      type: OrganizationType.PLATFORM,
      status: OrganizationStatus.ACTIVE,
    },
    create: {
      name: 'TheDigiHubs Platform Admin',
      slug: 'thedigihubs-platform-admin',
      type: OrganizationType.PLATFORM,
      status: OrganizationStatus.ACTIVE,
      country: 'United States',
      description: 'Platform administration tenant for TheDigiHubs.',
    },
  });

  const buyer = await prisma.organization.upsert({
    where: { slug: 'globaltech-industries' },
    update: {
      name: 'GlobalTech Industries',
      type: OrganizationType.BUYER,
      status: OrganizationStatus.ACTIVE,
    },
    create: {
      name: 'GlobalTech Industries',
      slug: 'globaltech-industries',
      type: OrganizationType.BUYER,
      status: OrganizationStatus.ACTIVE,
      country: 'United States',
      website: 'https://globaltech.example',
      description: 'Buyer organization using TheDigiHubs for strategic sourcing.',
    },
  });

  const supplier = await prisma.organization.upsert({
    where: { slug: 'smartgrow-solutions' },
    update: {
      name: 'SmartGrow Solutions',
      type: OrganizationType.SUPPLIER,
      status: OrganizationStatus.ACTIVE,
    },
    create: {
      name: 'SmartGrow Solutions',
      slug: 'smartgrow-solutions',
      type: OrganizationType.SUPPLIER,
      status: OrganizationStatus.ACTIVE,
      country: 'United States',
      website: 'https://smartgrow.example',
      description: 'Verified supplier organization responding to matched opportunities.',
    },
  });

  await assignPlan(platform.id, PlanKey.ENTERPRISE);
  await assignPlan(buyer.id, PlanKey.PROFESSIONAL);
  await assignPlan(supplier.id, PlanKey.PROFESSIONAL);

  const existingPlatformAdmin = await prisma.user.findUnique({
    where: { email: platformAdminEmail },
    select: { id: true },
  });
  if (platformAdminEmail !== legacyPlatformAdminEmail && !existingPlatformAdmin) {
    await prisma.user.updateMany({
      where: { email: legacyPlatformAdminEmail },
      data: { email: platformAdminEmail },
    });
  }
  if (platformAdminEmail !== legacyPlatformAdminEmail && existingPlatformAdmin) {
    await prisma.user.updateMany({
      where: { email: legacyPlatformAdminEmail },
      data: { status: 'SUSPENDED' },
    });
  }

  const adminUser = await upsertUserWithMembership({
    email: platformAdminEmail,
    name: 'Maya Johnson',
    password: devPasswords.admin,
    roleKey: RoleKey.PLATFORM_ADMIN,
    organizationId: platform.id,
  });

  const buyerUser = await upsertUserWithMembership({
    email: 'buyer@demo.com',
    name: 'Alex Morgan',
    password: devPasswords.buyer,
    roleKey: RoleKey.BUYER_MANAGER,
    organizationId: buyer.id,
  });

  await upsertUserWithMembership({
    email: 'supplier@demo.com',
    name: 'Sarah Chen',
    password: devPasswords.supplier,
    roleKey: RoleKey.SUPPLIER_OWNER,
    organizationId: supplier.id,
  });

  await prisma.supplierProfile.upsert({
    where: { organizationId: supplier.id },
    update: {
      verificationStatus: SupplierVerificationStatus.VERIFIED,
      rating: 4.9,
      completedContracts: 82,
      responseRate: 96,
      averageResponseHrs: 8,
      countriesServed: ['United States', 'Canada', 'Mexico'],
      categories: ['IT Services', 'Agriculture Technology', 'Facilities'],
      certifications: ['ISO 9001', 'SOC 2'],
      keywords: ['enterprise IT', 'implementation', 'support', 'infrastructure', 'smart agriculture'],
    },
    create: {
      organizationId: supplier.id,
      verificationStatus: SupplierVerificationStatus.VERIFIED,
      rating: 4.9,
      completedContracts: 82,
      responseRate: 96,
      averageResponseHrs: 8,
      countriesServed: ['United States', 'Canada', 'Mexico'],
      categories: ['IT Services', 'Agriculture Technology', 'Facilities'],
      certifications: ['ISO 9001', 'SOC 2'],
      keywords: ['enterprise IT', 'implementation', 'support', 'infrastructure', 'smart agriculture'],
    },
  });

  const additionalSuppliers = [
    {
      name: 'MediSource International',
      slug: 'medisource-international',
      country: 'India',
      rating: 4.8,
      countriesServed: ['Nepal', 'India', 'Bangladesh', 'Kenya'],
      categories: ['Medical Supplies', 'Diagnostics'],
      certifications: ['ISO 13485', 'WHO-GMP'],
      keywords: ['rapid test kits', 'diagnostics', 'medical consumables'],
    },
    {
      name: 'AfriLogix Supply Co.',
      slug: 'afrilogix-supply-co',
      country: 'South Africa',
      rating: 4.5,
      countriesServed: ['South Africa', 'Zimbabwe', 'Zambia', 'Botswana'],
      categories: ['Logistics', 'Warehousing'],
      certifications: ['ISO 9001'],
      keywords: ['cold chain', 'third party logistics', 'warehousing'],
    },
    {
      name: 'AsiaTech Equipment Ltd',
      slug: 'asiatech-equipment-ltd',
      country: 'Singapore',
      rating: 4.7,
      countriesServed: ['Nepal', 'Singapore', 'Thailand', 'Philippines'],
      categories: ['IT Equipment', 'Office Equipment'],
      certifications: ['ISO 27001', 'ISO 9001'],
      keywords: ['laptops', 'servers', 'networking', 'enterprise hardware'],
    },
  ];

  for (const item of additionalSuppliers) {
    const org = await prisma.organization.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        type: OrganizationType.SUPPLIER,
        status: OrganizationStatus.ACTIVE,
      },
      create: {
        name: item.name,
        slug: item.slug,
        type: OrganizationType.SUPPLIER,
        status: OrganizationStatus.ACTIVE,
        country: item.country,
        description: `${item.name} is a verified supplier on TheDigiHubs.`,
      },
    });

    await prisma.supplierProfile.upsert({
      where: { organizationId: org.id },
      update: {
        verificationStatus: SupplierVerificationStatus.VERIFIED,
        rating: item.rating,
        completedContracts: Math.floor(item.rating * 18),
        responseRate: 92,
        averageResponseHrs: 18,
        countriesServed: item.countriesServed,
        categories: item.categories,
        certifications: item.certifications,
        keywords: item.keywords,
      },
      create: {
        organizationId: org.id,
        verificationStatus: SupplierVerificationStatus.VERIFIED,
        rating: item.rating,
        completedContracts: Math.floor(item.rating * 18),
        responseRate: 92,
        averageResponseHrs: 18,
        countriesServed: item.countriesServed,
        categories: item.categories,
        certifications: item.certifications,
        keywords: item.keywords,
      },
    });
  }

  const rfq = await prisma.rfq.upsert({
    where: { reference: 'TDH-RFQ-2026-0001' },
    update: {},
    create: {
      reference: 'TDH-RFQ-2026-0001',
      title: 'Enterprise IT infrastructure implementation',
      description: 'The buyer is seeking a reliable partner to provide end-to-end IT infrastructure services including network design, installation, configuration, and ongoing support.',
      category: 'IT Services',
      country: 'United States',
      deliveryLocation: 'Austin, Texas, USA',
      currency: 'USD',
      estimatedBudget: '150000',
      closingDate: new Date('2026-07-31T22:00:00Z'),
      status: RfqStatus.QUOTATION_OPEN,
      buyerOrganizationId: buyer.id,
      createdById: buyerUser.id,
      evaluationCriteria: {
        technical: 45,
        price: 30,
        delivery: 15,
        compliance: 10,
      },
      technicalNotes: 'Review the attached implementation scope and post-implementation support requirements.',
      supportingDocuments: [
        { name: 'Technical_Specification.pdf', size: 1240000, type: 'application/pdf' },
        { name: 'Scope_of_Work.docx', size: 512000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      ],
      lineItems: {
        create: [
          { name: 'Network Equipment', quantity: '10', unit: 'items', description: 'Enterprise-grade switches, routers, and firewalls.' },
          { name: 'Implementation Services', quantity: '1', unit: 'project', description: 'Network design, installation, and configuration.' },
          { name: 'IT Support', quantity: '12', unit: 'months', description: '24/7 support and maintenance.' },
        ],
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: adminUser.id,
      action: 'SEED_COMPLETED',
      entity: 'System',
      entityId: platform.id,
      metadata: { source: 'seed' },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: buyerUser.id,
      rfqId: rfq.id,
      action: 'SEED_RFQ_CREATED',
      entity: 'Rfq',
      entityId: rfq.id,
      metadata: { source: 'seed' },
    },
  });

  console.log('Seed completed');
  console.log(`Platform admin account: ${platformAdminEmail}`);
}

main().finally(async () => prisma.$disconnect());
