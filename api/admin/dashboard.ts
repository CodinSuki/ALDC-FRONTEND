import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdminSession } from '../../lib/admin/utils/auth.js';
import { supabaseAdmin } from '../../lib/admin/utils/supabaseAdmin.js';

type DashboardStat = {
  totalProjects: number;
  totalProperties: number;
  availableProperties: number;
  paymentsDue: number;
  overduePayments: number;
  activeInquiries: number;
  activeTransactions: number;
  completedTransactions: number;
  activeTransactionValue: number;
};

type MonthlyPoint = {
  month: string;
  sold: number;
  reserved: number;
};

type PropertyTypePoint = {
  name: string;
  value: number;
  color: string;
};

type DashboardInquiry = {
  client: string;
  property: string;
  status: string;
};

type DashboardTransaction = {
  property: string;
  amount: string;
  status: string;
};

type AdminDashboardData = {
  stats: DashboardStat;
  monthlyData: MonthlyPoint[];
  propertyTypeData: PropertyTypePoint[];
  recentInquiries: DashboardInquiry[];
  recentTransactions: DashboardTransaction[];
};

type RevenuePoint = {
  month: string;
  revenue: number;
  transactions: number;
};

type ProjectPerformance = {
  project: string;
  sold: number;
  available: number;
  revenue: number;
};

type ActivityLogEntry = {
  activityid: number;
  staffname: string;
  activitytype: string;
  entitytype: string;
  entityid: number;
  description: string;
  createdat: string;
};

type CommissionReport = {
  staffname: string;
  staffrole: string;
  totalcommission: number;
  transactioncount: number;
};

type ReportsData = {
  revenues: RevenuePoint[];
  projectPerformance: ProjectPerformance[];
  activityLogs: ActivityLogEntry[];
  commissions: CommissionReport[];
};

type ListingStatusRow = {
  propertylistingstatusid: number;
  propertylistingstatuscode: string | null;
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6', '#6366f1'];

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asText = (value: unknown, fallback = ''): string => {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
};

const monthLabel = (isoLike: string): string => {
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-US', { month: 'short' });
};

const currency = (value: number): string =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(value);

const isCompletedTransactionStatus = (status: string): boolean => {
  const normalized = status.toLowerCase();
  return normalized.includes('complete') || normalized.includes('paid');
};

const isOverdueStatus = (status: string): boolean => status.toLowerCase().includes('overdue');

const isDueStatus = (status: string): boolean => {
  const normalized = status.toLowerCase();
  return normalized.includes('due') && !normalized.includes('overdue');
};

const isActiveInquiryStatus = (status: string): boolean => {
  const normalized = status.toLowerCase();
  return !normalized.includes('converted') && !normalized.includes('closed') && !normalized.includes('published');
};

const formatName = (first?: string | null, middle?: string | null, last?: string | null): string =>
  [first, middle, last].filter(Boolean).join(' ').trim();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireAdminSession(req, res)) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const view = req.query.view as string | undefined;

    // Handle reports view
    if (view === 'reports') {
      const [transactionsRes, activityRes, staffRes, projectRes, propertyRes, commissionRes] = await Promise.all([
        supabaseAdmin
          .from('transaction')
          .select('transactionid, propertyid, negotiatedprice, transactionstatus, createdat')
          .order('createdat', { ascending: false }),
        supabaseAdmin
          .from('activitylog')
          .select('activityid, staffid, activitytype, entitytype, entityid, description, createddat')
          .order('createddat', { ascending: false })
          .limit(100),
        supabaseAdmin.from('staff').select('staffid, firstname, middlename, lastname, role'),
        supabaseAdmin.from('project').select('projectid, projectname'),
        supabaseAdmin
          .from('property')
          .select('propertyid, projectid, propertylistingstatusid, createdat')
          .eq('is_archived', false),
        supabaseAdmin.from('commission').select('commissionid, staffid, commissionamount, createdat'),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (activityRes.error) throw activityRes.error;
      if (staffRes.error) throw staffRes.error;
      if (projectRes.error) throw projectRes.error;
      if (propertyRes.error) throw propertyRes.error;
      if (commissionRes.error) throw commissionRes.error;

      const transactions = (transactionsRes.data ?? []) as Array<Record<string, unknown>>;
      const activityLogs = (activityRes.data ?? []) as Array<Record<string, unknown>>;
      const staffRows = (staffRes.data ?? []) as Array<Record<string, unknown>>;
      const projects = (projectRes.data ?? []) as Array<Record<string, unknown>>;
      const properties = (propertyRes.data ?? []) as Array<Record<string, unknown>>;
      const commissions = (commissionRes.data ?? []) as Array<Record<string, unknown>>;

      // Build staff map
      const staffMap = new Map<number, string>();
      staffRows.forEach((row) => {
        const name = formatName(row.firstname as string | null, row.middlename as string | null, row.lastname as string | null);
        staffMap.set(toNumber(row.staffid), name || `Staff #${toNumber(row.staffid)}`);
      });

      // Build project map
      const projectMap = new Map<number, string>();
      projects.forEach((row) => {
        projectMap.set(toNumber(row.projectid), asText(row.projectname, `Project #${toNumber(row.projectid)}`));
      });

      // Build property-to-project map
      const propertyProjectMap = new Map<number, number>();
      properties.forEach((row) => {
        propertyProjectMap.set(toNumber(row.propertyid), toNumber(row.projectid));
      });

      // Calculate revenue trends (last 6 months)
      const revenueMap = new Map<string, { revenue: number; transactions: number }>();
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      transactions.forEach((row) => {
        const amount = toNumber(row.negotiatedprice ?? 0);
        const dateStr = asText(row.createdat, '');
        const month = dateStr ? monthLabel(dateStr) : 'N/A';

        if (!revenueMap.has(month)) {
          revenueMap.set(month, { revenue: 0, transactions: 0 });
        }
        const entry = revenueMap.get(month);
        if (entry) {
          entry.revenue += amount;
          entry.transactions += 1;
        }
      });

      const revenues: RevenuePoint[] = monthOrder
        .map((month) => {
          const data = revenueMap.get(month) ?? { revenue: 0, transactions: 0 };
          return {
            month,
            revenue: data.revenue,
            transactions: data.transactions,
          };
        })
        .filter((point) => point.revenue > 0 || point.transactions > 0 || monthOrder.indexOf(point.month) >= monthOrder.length - 6);

      // Calculate project performance
      const projectPerformanceMap = new Map<number, { sold: number; available: number; revenue: number }>();

      properties.forEach((row) => {
        const projectId = toNumber(row.projectid);
        if (!projectPerformanceMap.has(projectId)) {
          projectPerformanceMap.set(projectId, { sold: 0, available: 0, revenue: 0 });
        }
      });

      transactions.forEach((row) => {
        const propertyId = toNumber(row.propertyid);
        const projectId = propertyProjectMap.get(propertyId);
        if (projectId && projectPerformanceMap.has(projectId)) {
          const amount = toNumber(row.negotiatedprice ?? 0);
          const entry = projectPerformanceMap.get(projectId);
          if (entry) {
            entry.sold += 1;
            entry.revenue += amount;
          }
        }
      });

      const projectPerformance: ProjectPerformance[] = Array.from(projectPerformanceMap.entries())
        .map(([projectId, data]) => {
          const projectName = projectMap.get(projectId) ?? `Project #${projectId}`;
          const totalLots = properties.filter((p) => toNumber(p.projectid) === projectId).length;
          return {
            project: projectName,
            sold: data.sold,
            available: totalLots - data.sold,
            revenue: data.revenue,
          };
        })
        .sort((a, b) => b.revenue - a.revenue);

      // Build activity logs
      const activityLogsData: ActivityLogEntry[] = activityLogs.map((row) => ({
        activityid: toNumber(row.activityid),
        staffname: staffMap.get(toNumber(row.staffid)) ?? 'N/A',
        activitytype: asText(row.activitytype, 'Unknown'),
        entitytype: asText(row.entitytype, 'Unknown'),
        entityid: toNumber(row.entityid),
        description: asText(row.description, ''),
        createdat: asText(row.createddat, ''),
      }));

      // Build commission reports
      const commissionMap = new Map<number, { amount: number; count: number }>();
      commissions.forEach((row) => {
        const staffId = toNumber(row.staffid);
        const amount = toNumber(row.commissionamount ?? 0);
        if (!commissionMap.has(staffId)) {
          commissionMap.set(staffId, { amount: 0, count: 0 });
        }
        const entry = commissionMap.get(staffId);
        if (entry) {
          entry.amount += amount;
          entry.count += 1;
        }
      });

      const commissionReports: CommissionReport[] = Array.from(commissionMap.entries())
        .map(([staffId, data]) => {
          const staff = staffRows.find((s) => toNumber(s.staffid) === staffId);
          return {
            staffname: staffMap.get(staffId) ?? 'N/A',
            staffrole: asText(staff?.role, 'Unknown'),
            totalcommission: data.amount,
            transactioncount: data.count,
          };
        })
        .sort((a, b) => b.totalcommission - a.totalcommission);

      const reportsData: ReportsData = {
        revenues,
        projectPerformance,
        activityLogs: activityLogsData.slice(0, 50),
        commissions: commissionReports,
      };

      return res.status(200).json(reportsData);
    }

    // Default dashboard view
    const [projectsCountRes, propertiesRes, propertyTypesRes, listingStatusRes, transactionsRes, consultationRes, inquiryRes, clientRes] =
      await Promise.all([
        supabaseAdmin.from('project').select('projectid', { count: 'exact', head: true }),
        supabaseAdmin
          .from('property')
          .select('propertyid, propertyname, propertytypeid, propertylistingstatusid, is_archived, createdat'),
        supabaseAdmin.from('propertytype').select('propertytypeid, propertytypename'),
        supabaseAdmin
          .from('propertylistingstatus')
          .select('propertylistingstatusid, propertylistingstatuscode, propertylistingstatusname'),
        supabaseAdmin.from('transaction').select('transactionid, propertyid, negotiatedprice, transactionstatus, createdat').order('createdat', { ascending: false }),
        supabaseAdmin.from('consultationrequest').select('fullname, consultationstatus, createdat'),
        supabaseAdmin.from('propertyinquiry').select('propertyinquiryid, propertyid, clientid, inquirystatus, createdat'),
        supabaseAdmin.from('client').select('clientid, firstname, middlename, lastname'),
      ]);

    if (projectsCountRes.error) throw projectsCountRes.error;
    if (propertiesRes.error) throw propertiesRes.error;
    if (propertyTypesRes.error) throw propertyTypesRes.error;
    if (listingStatusRes.error) throw listingStatusRes.error;
    if (transactionsRes.error) throw transactionsRes.error;
    if (consultationRes.error) throw consultationRes.error;
    if (inquiryRes.error) throw inquiryRes.error;
    if (clientRes.error) throw clientRes.error;

    const properties = (propertiesRes.data ?? []) as Array<Record<string, unknown>>;
    const propertyTypes = (propertyTypesRes.data ?? []) as Array<Record<string, unknown>>;
    const listingStatuses = (listingStatusRes.data ?? []) as ListingStatusRow[];
    const clientRows = (clientRes.data ?? []) as Array<Record<string, unknown>>;

    const listingCodeById = new Map<number, string>(
      listingStatuses.map((row) => [Number(row.propertylistingstatusid), asText(row.propertylistingstatuscode).toUpperCase()])
    );

    const propertyTypeNameById = new Map<number, string>(
      propertyTypes.map((row) => [toNumber(row.propertytypeid), asText(row.propertytypename, 'Unknown')])
    );

    const propertyById = new Map<number, string>(
      properties.map((row) => [toNumber(row.propertyid), asText(row.propertyname, `Property #${toNumber(row.propertyid)}`)])
    );

    const clientById = new Map<number, string>(
      clientRows.map((row) => [
        toNumber(row.clientid),
        formatName(row.firstname as string | null, row.middlename as string | null, row.lastname as string | null) ||
          `Client #${toNumber(row.clientid)}`,
      ])
    );

    const activeProperties = properties.filter((row) => !(row.is_archived ?? row.isarchived));

    const availableProperties = activeProperties.filter((row) => {
      const statusId = toNumber(row.propertylistingstatusid);
      const statusCode = listingCodeById.get(statusId) ?? '';
      return statusCode === 'AVL';
    }).length;

    const propertyTypeCount = new Map<string, number>();
    for (const property of activeProperties) {
      const propertyTypeId = toNumber(property.propertytypeid);
      const propertyTypeName = propertyTypeNameById.get(propertyTypeId) ?? 'Unknown';
      propertyTypeCount.set(propertyTypeName, (propertyTypeCount.get(propertyTypeName) ?? 0) + 1);
    }

    const propertyTypeData: PropertyTypePoint[] = Array.from(propertyTypeCount.entries())
      .map(([name, value], index) => ({
        name,
        value,
        color: PIE_COLORS[index % PIE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    const transactionRows = transactionsRes.error ? [] : ((transactionsRes.data ?? []) as Array<Record<string, unknown>>);
    const monthlyMap = new Map<string, { sold: number; reserved: number }>();

    const recentTransactions: DashboardTransaction[] = transactionRows.slice(0, 5).map((row) => {
      const status = asText(row.transactionstatus ?? 'In Progress', 'In Progress');
      const propertyId = toNumber(row.propertyid);
      const propertyName = propertyById.get(propertyId) ?? `Property #${propertyId}`;
      const amountValue = toNumber(row.negotiatedprice ?? 0);
      const transactionDate = asText(row.createdat, '');
      const month = transactionDate ? monthLabel(transactionDate) : 'N/A';

      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { sold: 0, reserved: 0 });
      }

      const bucket = monthlyMap.get(month);
      if (bucket) {
        if (isCompletedTransactionStatus(status)) {
          bucket.sold += 1;
        } else {
          bucket.reserved += 1;
        }
      }

      return {
        property: propertyName,
        amount: currency(amountValue),
        status,
      };
    });

    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData: MonthlyPoint[] = monthOrder.map((month) => {
      const values = monthlyMap.get(month) ?? { sold: 0, reserved: 0 };
      return {
        month,
        sold: values.sold,
        reserved: values.reserved,
      };
    });

    const activeTransactions = transactionRows.filter((row) => {
      const status = asText(row.transactionstatus ?? 'In Progress', 'In Progress');
      return !isCompletedTransactionStatus(status);
    });

    const completedTransactions = transactionRows.filter((row) => {
      const status = asText(row.transactionstatus ?? 'In Progress', 'In Progress');
      return isCompletedTransactionStatus(status);
    });

    const paymentsDue = transactionRows.filter((row) => {
      const status = asText(row.transactionstatus ?? '', '');
      return isDueStatus(status);
    }).length;

    const overduePayments = transactionRows.filter((row) => {
      const status = asText(row.transactionstatus ?? '', '');
      return isOverdueStatus(status);
    }).length;

    const activeTransactionValue = activeTransactions.reduce((sum, row) => {
      const amountValue = toNumber(row.negotiatedprice ?? 0);
      return sum + amountValue;
    }, 0);

    const consultationItems = ((consultationRes.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      client: asText(row.fullname, 'N/A'),
      property: 'Consultation',
      status: asText(row.consultationstatus, 'New'),
      createdAt: asText(row.createdat),
    }));

    const inquiryItems = ((inquiryRes.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      client: clientById.get(toNumber(row.clientid)) ?? 'N/A',
      property: propertyById.get(toNumber(row.propertyid)) ?? `Property #${toNumber(row.propertyid)}`,
      status: asText(row.inquirystatus, 'New'),
      createdAt: asText(row.createdat),
    }));

    const allInquiries = [...consultationItems, ...inquiryItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const activeInquiries = allInquiries.filter((item) => isActiveInquiryStatus(asText(item.status))).length;

    const recentInquiries: DashboardInquiry[] = allInquiries.slice(0, 5).map((item) => ({
      client: asText(item.client, 'N/A'),
      property: asText(item.property, 'N/A'),
      status: asText(item.status, 'New'),
    }));

    const response: AdminDashboardData = {
      stats: {
        totalProjects: toNumber(projectsCountRes.count ?? 0),
        totalProperties: activeProperties.length,
        availableProperties,
        paymentsDue,
        overduePayments,
        activeInquiries,
        activeTransactions: activeTransactions.length,
        completedTransactions: completedTransactions.length,
        activeTransactionValue,
      },
      monthlyData,
      propertyTypeData,
      recentInquiries,
      recentTransactions,
    };

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load dashboard',
    });
  }
}
