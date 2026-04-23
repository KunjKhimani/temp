/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  fetchUserAnalytics,
  fetchConversationAnalytics,
  fetchMessageAnalytics,
  fetchServiceRequestAnalytics,
  fetchServiceAnalytics,
  fetchProductAnalytics,
  fetchOrderAnalytics,
  fetchProductOrderAnalytics,
} from "../../../store/thunks/analyticsThunks";

import "./dashboard.css";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A28DFF",
  "#FF6F61",
  "#8DD1E1",
  "#82ca9d",
];

const Dashboard = () => {
  const dispatch = useDispatch();

  // Analytics data from Redux store
  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useSelector((state) => state.analytics.user);
  const {
    data: serviceRequestData,
    loading: serviceRequestLoading,
    error: serviceRequestError,
  } = useSelector((state) => state.analytics.serviceRequest);
  const {
    data: productData,
    loading: productLoading,
    error: productError,
  } = useSelector((state) => state.analytics.product);
  const {
    data: orderData,
    loading: orderLoading,
    error: orderError,
  } = useSelector((state) => state.analytics.order);
  const {
    data: productOrderData,
    loading: productOrderLoading,
    error: productOrderError,
  } = useSelector((state) => state.analytics.productOrder);
  const {
    data: conversationData,
    loading: conversationLoading,
    error: conversationError,
  } = useSelector((state) => state.analytics.conversation);
  const {
    data: messageData,
    loading: messageLoading,
    error: messageError,
  } = useSelector((state) => state.analytics.message);
  const {
    data: serviceData,
    loading: serviceLoading,
    error: serviceError,
  } = useSelector((state) => state.analytics.service);

  // Fetch all analytics data on component mount
  useEffect(() => {
    dispatch(fetchUserAnalytics());
    dispatch(fetchServiceRequestAnalytics());
    dispatch(fetchProductAnalytics());
    dispatch(fetchOrderAnalytics());
    dispatch(fetchProductOrderAnalytics());
    dispatch(fetchConversationAnalytics());
    dispatch(fetchMessageAnalytics());
    dispatch(fetchServiceAnalytics());
  }, [dispatch]);

  // Transform raw data into chart-friendly format
  const userStats = userData?.data
    ? [
        { name: "Total Users", value: userData.data.totalUsers || 0 },
        {
          name: "New Users (Last 30 Days)",
          value: userData.data.newUsersLast30Days || 0,
        },
      ]
    : [];

  const serviceRequestStats = serviceRequestData?.data
    ? [
        { name: "Pending", value: serviceRequestData.data.pending || 0 },
        { name: "Completed", value: serviceRequestData.data.completed || 0 },
        { name: "Cancelled", value: serviceRequestData.data.cancelled || 0 },
      ]
    : [];

  const productStats = productData?.data
    ? [
        { name: "Total Products", value: productData.data.totalProducts || 0 },
        {
          name: "New Products (Last 30 Days)",
          value: productData.data.newProductsLast30Days || 0,
        },
      ]
    : [];

  const orderStats = orderData?.data
    ? [
        { name: "Total Orders", value: orderData.data.totalOrders || 0 },
        { name: "Pending Orders", value: orderData.data.pendingOrders || 0 },
        {
          name: "Completed Orders",
          value: orderData.data.completedOrders || 0,
        },
      ]
    : [];

  const productOrderStats = productOrderData?.data
    ? [
        {
          name: "Total Product Orders",
          value: productOrderData.data.totalProductOrders || 0,
        },
        {
          name: "Total Revenue",
          value: productOrderData.data.totalProductOrderRevenue || 0,
        },
      ]
    : [];

  const conversationStats = conversationData?.data
    ? [
        {
          name: "Total Conversations",
          value: conversationData.data.totalConversations || 0,
        },
        {
          name: "Active Conversations",
          value: conversationData.data.activeConversations || 0,
        },
      ]
    : [];

  const messageStats = messageData?.data
    ? [
        { name: "Total Messages", value: messageData.data.totalMessages || 0 },
        {
          name: "New Messages (Last 24h)",
          value: messageData.data.newMessagesLast24h || 0,
        },
      ]
    : [];

  const serviceStats = serviceData?.data
    ? [
        { name: "Total Services", value: serviceData.data.totalServices || 0 },
        {
          name: "Active Services",
          value: serviceData.data.activeServices || 0,
        },
      ]
    : [];

  // Get monthly trends or create empty arrays if not available
  const userMonthlyTrend =
    userData?.data?.userRegistrationMonthlyTrend ||
    Array(3).fill({ month: "", count: 0 });
  const serviceRequestMonthlyTrend =
    serviceRequestData?.data?.serviceRequestsMonthlyTrend ||
    Array(3).fill({ month: "", count: 0 });
  const productMonthlyTrend =
    productData?.data?.productsMonthlyTrend ||
    Array(3).fill({ month: "", count: 0 });
  const orderMonthlyTrend =
    orderData?.data?.ordersMonthlyTrend ||
    Array(3).fill({ month: "", count: 0 });
  const productOrderMonthlyTrend =
    productOrderData?.data?.productOrdersMonthlyTrend ||
    Array(3).fill({ month: "", revenue: 0 });
  const serviceMonthlyTrend =
    serviceData?.data?.servicesMonthlyTrend ||
    Array(3).fill({ month: "", count: 0 });

  // Helper to render loading/error states
  const renderContent = (
    data,
    loading,
    error,
    ChartComponent,
    title,
    cols = 1
  ) => {
    if (loading) return <LoadingCard title={title} cols={cols} />;
    if (error) return <ErrorCard error={error} title={title} cols={cols} />;
    if (!data || data.length === 0)
      return <EmptyCard title={title} cols={cols} />;

    return (
      <Card
        title={title}
        cols={cols}
        stats={
          typeof data[0].value !== "object" && data.length > 1
            ? data.slice(0, 2).map((item) => ({
                label: item.name,
                value: item.value.toLocaleString(),
              }))
            : []
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          {ChartComponent}
        </ResponsiveContainer>
      </Card>
    );
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Monitoring key metrics across all platforms</p>
      </header>

      <div className="stats-grid">
        {/* Summary Cards */}
        <SummaryCard
          title="Total Revenue"
          value={`$${(
            productOrderData?.data?.totalProductOrderRevenue || 0
          ).toLocaleString()}`}
          change="+12.5%"
          icon="💰"
        />
        <SummaryCard
          title="Active Users"
          value={(userData?.data?.activeUsers || 0).toLocaleString()}
          change="+5.2%"
          icon="👥"
        />
        <SummaryCard
          title="Conversion Rate"
          value={`${(
            (productOrderData?.data?.totalProductOrders /
              productData?.data?.totalProducts) *
              100 || 0
          ).toFixed(1)}%`}
          change="+1.7%"
          icon="📈"
        />
        <SummaryCard
          title="Avg Order Value"
          value={`$${(
            productOrderData?.data?.averageProductOrderValue || 0
          ).toLocaleString()}`}
          change="+3.1%"
          icon="🧮"
        />

        {/* Charts */}
        {renderContent(
          userStats,
          userLoading,
          userError,
          <BarChart data={userMonthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              name="Users"
              fill="#00C49F"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>,
          "User Growth Trend",
          2
        )}

        {renderContent(
          serviceRequestStats,
          serviceRequestLoading,
          serviceRequestError,
          <PieChart>
            <Pie
              data={serviceRequestStats}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {serviceRequestStats.map((entry, index) => (
                <Cell
                  key={`cell-sr-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>,
          "Service Requests Distribution"
        )}

        {renderContent(
          productStats,
          productLoading,
          productError,
          <BarChart data={productMonthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              name="Products"
              fill="#FFBB28"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>,
          "Product Growth Trend"
        )}

        {renderContent(
          orderStats,
          orderLoading,
          orderError,
          <LineChart data={orderMonthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              name="Orders"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>,
          "Order Trends"
        )}

        {renderContent(
          productOrderStats,
          productOrderLoading,
          productOrderError,
          <BarChart data={productOrderMonthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="revenue"
              name="Revenue"
              fill="#FF6F61"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>,
          "Product Revenue Over Time"
        )}

        {renderContent(
          serviceStats,
          serviceLoading,
          serviceError,
          <BarChart data={serviceMonthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="count"
              name="Services"
              fill="#A28DFF"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>,
          "Service Growth Trend"
        )}

        {renderContent(
          conversationStats,
          conversationLoading,
          conversationError,
          <PieChart>
            <Pie
              data={conversationStats}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
            >
              {conversationStats.map((entry, index) => (
                <Cell
                  key={`cell-conv-${index}`}
                  fill={COLORS[(index + 2) % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>,
          "Conversation Status"
        )}

        {renderContent(
          messageStats,
          messageLoading,
          messageError,
          <LineChart
            data={messageData?.data?.newMessagesLast7Days || Array(7).fill(0)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="day" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              name="New Messages"
              stroke="#FF8042"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>,
          "Recent Message Activity"
        )}
      </div>
    </div>
  );
};

// Component for individual cards with charts
const Card = ({ title, children, cols = 1, stats = [] }) => (
  <div className={`card card-cols-${cols}`}>
    <div className="card-header">
      <h2>{title}</h2>
      {stats.length > 0 && (
        <div className="card-stats">
          {stats.map((stat, index) => (
            <div key={index} className="card-stat">
              <span className="card-stat-label">{stat.label}</span>
              <span className="card-stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    <div className="card-body">{children}</div>
  </div>
);

// Component for summary cards
const SummaryCard = ({ title, value, change, icon }) => (
  <div className="summary-card">
    <div className="summary-icon">{icon}</div>
    <div className="summary-content">
      <h3>{title}</h3>
      <p className="summary-value">{value}</p>
      <p className="summary-change">↑ {change} from last week</p>
    </div>
  </div>
);

// Loading state component
const LoadingCard = ({ title, cols = 1 }) => (
  <div className={`card card-cols-${cols}`}>
    <div className="card-header">
      <h2>{title}</h2>
    </div>
    <div className="card-body">
      <div className="loading">Loading {title}...</div>
    </div>
  </div>
);

// Error state component
const ErrorCard = ({ error, title, cols = 1 }) => (
  <div className={`card card-cols-${cols}`}>
    <div className="card-header">
      <h2>{title}</h2>
    </div>
    <div className="card-body">
      <div className="error">
        Error loading {title}: {error.message || "Unknown error"}
      </div>
    </div>
  </div>
);

// Empty state component
const EmptyCard = ({ title, cols = 1 }) => (
  <div className={`card card-cols-${cols}`}>
    <div className="card-header">
      <h2>{title}</h2>
    </div>
    <div className="card-body">
      <div className="empty">No {title} data available.</div>
    </div>
  </div>
);

export default Dashboard;
