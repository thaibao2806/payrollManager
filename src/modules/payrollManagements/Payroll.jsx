import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  DatePicker,
  Row,
  Col,
  Space,
  Tooltip,
  Modal,
  Drawer,
  Card,
  Tag,
  Divider,
  Dropdown,
  Menu,
  Statistic,
  Progress,
  Form,
  InputNumber,
  Rate,
  Descriptions,
  App,
  Select,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  PrinterOutlined,
  FileExcelOutlined,
  FilterOutlined,
  MoreOutlined,
  MenuOutlined,
  AppstoreOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  StarOutlined,
} from "@ant-design/icons";
import PayrollModal from "./PayrollModal";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteAssignmetSlip,
  exportExcel,
  fillterAssignmentSlip,
} from "../../services/apiPlan/apiAssignmentSlip";
import { saveAs } from "file-saver";
import { mockPayrollData } from "../../data/mockPayrollData";
import AssessmentModal from "./AssessmentModal";
import ViewAssessmentModal from "./ViewAssessmentModal";
import {
  deletePayrollManager,
  filterPayrolls,
  getPayrollDashboard,
} from "../../services/apiPayroll/Payroll";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Hook để theo dõi kích thước màn hình
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

const Payroll = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [mobileActionDrawerVisible, setMobileActionDrawerVisible] =
    useState(false);
  const [assessmentModalVisible, setAssessmentModalVisible] = useState(false);
  const [viewAssessmentModalVisible, setViewAssessmentModalVisible] =
    useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [assessmentForm] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const navigate = useNavigate();

  const { modal } = App.useApp();

  // State cho summary statistics
  const [summaryStats, setSummaryStats] = useState({
    totalProducts: 0,
    totalPayroll: 0,
  });

  const { width } = useWindowSize();

  // Responsive breakpoints
  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  const isDesktop = width > 1024;

  useEffect(() => {
    fetchData(pagination.current, pagination.pageSize);
    getTotalAmount();
  }, []);

  const getTotalAmount = async () => {
    setLoading(true);
    try {
      const res = await getPayrollDashboard();

      if (res?.status === 200) {
        const data = res.data?.data || {};

        setSummaryStats({
          totalProducts: data.totalProducts ?? 0,
          totalPayroll: data.totalFund ?? 0,
        });
      }
    } catch (error) {
      console.error("getPayrollDashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const { payrollType, productName, managerName } = filters;

      let res = await filterPayrolls(
        payrollType,
        productName,
        managerName,
        page,
        pageSize
      );
      if (res && res.status === 200) {
        console.log(res);
        let { items, totalCount } = res.data.data;

        // Thêm STT và key
        let dataWithStt = items.map((item, index) => ({
          ...item,
          id: item.id,
          key: item.id,
          stt: (page - 1) * pageSize + index + 1,
          // Thêm dữ liệu mẫu cho tiến độ và quỹ lương còn lại
          progress: item.progress || 0,
          remainingBudget: item.remainingBudget || 0,
          // Dữ liệu đánh giá mẫu
          assessment: item.assessment || null,
        }));

        setDataSource(dataWithStt);
        setPagination({ current: page, pageSize, total: totalCount });

        // Tính toán summary statistics
        calculateSummaryStats(dataWithStt);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tính toán tổng số sản phẩm và tổng quỹ lương
  const calculateSummaryStats = (data) => {
    const totalProducts = data.length;

    const totalPayroll = data.reduce((sum, item) => {
      const nationalDefense = parseFloat(item.nationalDefense) || 0;
      const economy = parseFloat(item.economy) || 0;
      const nationalDefenseEconomy =
        parseFloat(item.nationalDefenseEconomy) || 0;
      return sum + nationalDefense + economy + nationalDefenseEconomy;
    }, 0);

    // setSummaryStats({
    //   totalProducts,
    //   totalPayroll,
    // });
  };

  const [filters, setFilters] = useState({
    productName: "",
    managerName: "",
    payrollType: "",
  });

  // Hàm xử lý đánh giá
  const handleAssessment = (record) => {
    setSelectedRecord(record);
    if (record.assessment) {
      assessmentForm.setFieldsValue(record.assessment);
    } else {
      assessmentForm.resetFields();
    }
    setAssessmentModalVisible(true);
  };

  // Hàm xử lý xem đánh giá
  const handleViewAssessment = (record) => {
    setSelectedRecord(record);
    setViewAssessmentModalVisible(true);
  };

  // Format số tiền
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "stt",
      width: isMobile ? 50 : 60,
      fixed: isMobile ? "left" : false,
    },
    {
      title: "Tên sản phẩm",
      dataIndex: "productName",
      width: isMobile ? 150 : 200,
    },
    {
      title: "Quốc phòng",
      dataIndex: "nationalDefense",
      width: isMobile ? 120 : 150,
      render: (value) => formatCurrency(value || 0),
    },
    {
      title: "Kinh tế",
      dataIndex: "economy",
      width: isMobile ? 100 : 120,
      render: (value) => formatCurrency(value || 0),
    },
    {
      title: "Quốc phòng yếu tố kinh tế",
      dataIndex: "nationalDefenseEconomy",
      width: isMobile ? 100 : 120,
      render: (value) => formatCurrency(value || 0),
    },
    {
      title: "Người quản lý",
      dataIndex: "managers",
      width: isMobile ? 100 : 120,
    },
    {
      title: "Đánh giá chất lượng",
      key: "qualityAssessment",
      width: isMobile ? 280 : 320,
      render: (_, record) => {
        const progress = record.progress ?? 0;
        const remainingFund = record.remainingFund ?? 0;
        const hasEvaluation = record.hasEvaluation;

        return (
          <div style={{ padding: "8px 0" }}>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              {/* ===== ACTION ===== */}
              <Space size="small">
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleAssessment(record)}
                  disabled={remainingFund <= 0}
                >
                  Đánh giá
                </Button>

                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/payroll/assessment/${record.id}`)}
                  disabled={!hasEvaluation}
                >
                  Xem
                </Button>
              </Space>

              {/* ===== PROGRESS ===== */}
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#666",
                    marginBottom: 4,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Tiến độ:</span>
                  <span style={{ fontWeight: 600 }}>{progress}%</span>
                </div>

                <Progress
                  percent={progress}
                  size="small"
                  status={progress === 100 ? "success" : "active"}
                />
              </div>

              {/* ===== REMAINING FUND ===== */}
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Quỹ lương còn lại:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color:
                      remainingFund > 10_000_000
                        ? "#52c41a"
                        : remainingFund > 0
                        ? "#faad14"
                        : "#ff4d4f",
                  }}
                >
                  {formatCurrency(remainingFund)} VNĐ
                </span>
              </div>
            </Space>
          </div>
        );
      },
    },

    {
      title: "Ghi chú",
      dataIndex: "note",
      width: isMobile ? 120 : 150,
      ellipsis: true,
    },
  ];

  // Mobile columns - simplified view
  const mobileColumns = [
    {
      title: "STT",
      dataIndex: "stt",
      width: 50,
      fixed: "left",
    },
    {
      title: "Thông tin",
      dataIndex: "documentNumber",
      fixed: "left",
      width: 200,
      render: (_, record) => (
        <div>
          <Link
            to={`/pl/phieu-giao-viec-chi-tiet/${record.id}`}
            style={{ fontWeight: 600, fontSize: 14 }}
          >
            {record.documentNumber}
          </Link>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            {record.productName}
          </div>
          <div style={{ fontSize: 12, color: "#666", marginTop: 2 }}>
            Tiến độ: {record.progress}%
          </div>
          <Progress percent={record.progress} size="small" />
          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
            Còn lại: {formatCurrency(record.remainingBudget)} VNĐ
          </div>
          <Space size="small" style={{ marginTop: 8 }}>
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleAssessment(record)}
            >
              Đánh giá
            </Button>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/fn/payroll-managent-detail/${item.id}`)}
              disabled={!item.assessment}
            >
              Xem
            </Button>
          </Space>
        </div>
      ),
    },
  ];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);

  const handleAdd = () => {
    setEditingData(null);
    setModalOpen(true);
    setMobileActionDrawerVisible(false);
  };

  const handleEdit = (record) => {
    setEditingData(record);
    setModalOpen(true);
  };

  const handleSubmit = (values) => {
    if (editingData) {
      console.log("Cập nhật:", values);
    } else {
      fetchData(pagination.current, pagination.pageSize);
    }
    setModalOpen(false);
  };

  // Xử lý submit đánh giá
  const handleAssessmentSubmit = async (data) => {
    fetchData(pagination.current, pagination.pageSize);

    Modal.success({
      title: "Thành công",
      content: "Đánh giá đã được lưu thành công!",
    });

    setAssessmentModalVisible(false);
  };

  // Xử lý chọn dòng
  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  // Xử lý nút xóa
  const handleDelete = () => {
    if (selectedRowKeys.length === 0) {
      Modal.warning({
        title: "Chưa chọn dòng nào",
        content: "Vui lòng chọn ít nhất một dòng để xóa.",
      });
      return;
    }

    modal.confirm({
      title: "Xác nhận xóa",
      content: `Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} dòng này không?`,
      okText: "Xóa",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          setLoading(true);
          await Promise.all(
            selectedRowKeys.map((id) => deletePayrollManager(id))
          );
          fetchData(pagination.current, pagination.pageSize);
          getTotalAmount();
          setSelectedRowKeys([]);
          setMobileActionDrawerVisible(false);

          Modal.success({
            title: "Xóa thành công",
            content: "Dữ liệu đã được xóa.",
          });
        } catch (error) {
          console.error(error);
          Modal.error({
            title: "Lỗi",
            content: "Không thể xóa dữ liệu. Vui lòng kiểm tra backend.",
          });
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleExportExcel = async () => {
    if (selectedRowKeys.length === 0) {
      Modal.warning({
        title: "Chưa chọn dòng nào",
        content: "Vui lòng chọn ít nhất một dòng để xuất Excel.",
      });
      return;
    }
    try {
      setLoading(true);
      for (const id of selectedRowKeys) {
        const matchedItem = dataSource.find((item) => item.id === id);
        const fileName = matchedItem?.documentNumber
          ? `PhieuGiaoViec_${matchedItem.documentNumber}.xlsx`
          : `PhieuGiaoViec_${id}.xlsx`;
        try {
          let res = await exportExcel(id);
          const blob = new Blob([res.data], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          });

          saveAs(blob, fileName);
        } catch (error) {
          console.log(error);
        }
      }
      setMobileActionDrawerVisible(false);
    } catch (error) {
      Modal.error({
        title: "Lỗi xuất file",
        content: "Đã xảy ra lỗi khi xuất một hoặc nhiều phiếu.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleSearch = () => {
    fetchData(1, pagination.pageSize);
    if (isMobile) {
      setFilterDrawerVisible(false);
    }
  };

  const handleReset = () => {
    setFilters({
      dateRange: null,
      documentNumber: "",
      productName: "",
      managementUnit: "",
      department: "",
    });
    fetchData(pagination.current, pagination.pageSize);
    if (isMobile) {
      setFilterDrawerVisible(false);
    }
  };

  // Action menu for mobile
  const actionMenu = (
    <Menu>
      <Menu.Item key="add" icon={<PlusOutlined />} onClick={handleAdd}>
        Thêm mới
      </Menu.Item>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={handleDelete}
        disabled={selectedRowKeys.length === 0}
        danger
      >
        Xóa ({selectedRowKeys.length})
      </Menu.Item>
      {/* <Menu.Item
        key="export"
        icon={<FileExcelOutlined />}
        onClick={handleExportExcel}
        disabled={selectedRowKeys.length === 0}
      >
        Xuất Excel ({selectedRowKeys.length})
      </Menu.Item> */}
    </Menu>
  );

  // Render filter form
  const renderFilterForm = () => (
    <div style={{ padding: isMobile ? 12 : 16 }}>
      <Row gutter={[16, 16]}>
        {/* <Col xs={24} sm={12} md={8}>
          <label style={{ display: "block", marginBottom: 4, fontSize: isMobile ? 12 : 14 }}>
            Thời gian
          </label>
          <RangePicker
            style={{ width: "100%" }}
            format="DD/MM/YYYY"
            value={filters.dateRange}
            onChange={(value) => handleFilterChange("dateRange", value)}
            size={isMobile ? "small" : "default"}
          />
        </Col> */}
        <Col xs={24} sm={12} md={8}>
          <label
            style={{
              display: "block",
              marginBottom: 4,
              fontSize: isMobile ? 12 : 14,
            }}
          >
            Loại quỹ lương
          </label>
          <Select
            placeholder="Chọn loại quỹ lương"
            value={filters.payrollType} // gán value từ filters
            onChange={(value) => handleFilterChange("payrollType", value)}
            size={isMobile ? "small" : "default"}
            style={{ width: "100%" }}
          >
            <Select.Option value="nationalDefense">Quốc phòng</Select.Option>
            <Select.Option value="economy">Kinh tế</Select.Option>
            <Select.Option value="nationalDefenseEconomy">
              Quốc phòng yếu tố kinh tế
            </Select.Option>
          </Select>
        </Col>

        <Col xs={24} sm={12} md={8}>
          <label
            style={{
              display: "block",
              marginBottom: 4,
              fontSize: isMobile ? 12 : 14,
            }}
          >
            Tên sản phẩm
          </label>
          <Input
            placeholder="Tên sản phẩm"
            value={filters.productName}
            onChange={(e) => handleFilterChange("productName", e.target.value)}
            size={isMobile ? "small" : "default"}
          />
        </Col>
        <Col xs={24} sm={12} md={8}>
          <label
            style={{
              display: "block",
              marginBottom: 4,
              fontSize: isMobile ? 12 : 14,
            }}
          >
            Người quản lý
          </label>
          <Input
            placeholder="Người quản lý"
            value={filters.managers}
            onChange={(e) => handleFilterChange("managers", e.target.value)}
            size={isMobile ? "small" : "default"}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 16, textAlign: "right" }}>
        <Button
          type="primary"
          onClick={handleSearch}
          style={{ marginRight: 8 }}
          size={isMobile ? "small" : "default"}
        >
          Lọc
        </Button>
        <Button onClick={handleReset} size={isMobile ? "small" : "default"}>
          Hủy
        </Button>
      </div>
    </div>
  );

  // Render mobile cards
  const renderMobileCards = () => (
    <div style={{ padding: "0 8px" }}>
      {dataSource.map((item, index) => (
        <Card
          key={item.key}
          size="small"
          style={{
            marginBottom: 12,
            border: selectedRowKeys.includes(item.key)
              ? "2px solid #1890ff"
              : "1px solid #f0f0f0",
          }}
          bodyStyle={{ padding: 12 }}
          onClick={() => {
            const newSelection = selectedRowKeys.includes(item.key)
              ? selectedRowKeys.filter((key) => key !== item.key)
              : [...selectedRowKeys, item.key];
            setSelectedRowKeys(newSelection);
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 12, color: "#666", marginRight: 8 }}>
                  #{item.stt}
                </span>
              </div>

              <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                <strong>Ngày:</strong>{" "}
                {item.documentDate
                  ? new Date(item.documentDate).toLocaleDateString("vi-VN")
                  : "---"}
              </div>

              <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>
                <strong>Sản phẩm:</strong> {item.productName}
              </div>

              <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                <strong>Tiến độ:</strong> {item.progress}%
              </div>

              <Progress
                percent={item.progress}
                size="small"
                style={{ marginBottom: 8 }}
              />

              <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
                <strong>Còn lại:</strong> {formatCurrency(item.remainingBudget)}{" "}
                VNĐ
              </div>

              <Space size="small" onClick={(e) => e.stopPropagation()}>
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleAssessment(item)}
                >
                  Đánh giá
                </Button>
                <Button
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    navigate(`/fn/payroll-managent-detail/${item.id}`)
                  }
                  disabled={!item.assessment}
                >
                  Xem
                </Button>
              </Space>
            </div>

            <div style={{ marginLeft: 12 }}>
              <Tag
                color={
                  item.approvalStatus === "approved"
                    ? "green"
                    : item.approvalStatus === "rejected"
                    ? "red"
                    : "orange"
                }
                style={{ fontSize: 10 }}
              >
                {item.approvalStatus === "approved"
                  ? "Đã duyệt"
                  : item.approvalStatus === "rejected"
                  ? "Từ chối"
                  : "Chờ duyệt"}
              </Tag>
            </div>
          </div>
        </Card>
      ))}

      {/* Mobile Pagination */}
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Button
          disabled={pagination.current === 1}
          onClick={() => fetchData(pagination.current - 1, pagination.pageSize)}
          size="small"
        >
          Trang trước
        </Button>
        <span style={{ margin: "0 12px", fontSize: 12 }}>
          {pagination.current} /{" "}
          {Math.ceil(pagination.total / pagination.pageSize)}
        </span>
        <Button
          disabled={
            pagination.current >=
            Math.ceil(pagination.total / pagination.pageSize)
          }
          onClick={() => fetchData(pagination.current + 1, pagination.pageSize)}
          size="small"
        >
          Trang sau
        </Button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? 8 : 5 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          flexWrap: isMobile ? "wrap" : "nowrap",
          gap: isMobile ? 8 : 0,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? 18 : 24,
            flex: isMobile ? "1 1 100%" : "auto",
          }}
        >
          Quản lý tiền lương
        </h1>

        {isMobile ? (
          <Space size="small">
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerVisible(true)}
              size="small"
              style={{ background: "#e6f4fb", color: "#0700ad" }}
            />
            <Dropdown overlay={actionMenu} trigger={["click"]}>
              <Button icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </Space>
        ) : (
          <Space size={isTablet ? "small" : "default"}>
            <Tooltip title="Tìm kiếm">
              <Button
                icon={<SearchOutlined />}
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  background: "#e6f4fb",
                  color: "#0700ad",
                  marginRight: 5,
                }}
                size={isTablet ? "small" : "default"}
              />
            </Tooltip>
            <Tooltip title="Thêm">
              <Button
                onClick={handleAdd}
                icon={<PlusOutlined />}
                style={{
                  background: "#e6f4fb",
                  color: "#0700ad",
                  marginRight: 5,
                }}
                size={isTablet ? "small" : "default"}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={handleDelete}
                disabled={selectedRowKeys.length === 0}
                size={isTablet ? "small" : "default"}
                style={{ marginRight: 5 }}
              />
            </Tooltip>
            {/* <Tooltip title="Xuất excel">
              <Button
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
                style={{ background: "#e6f4fb", color: "#0700ad" }}
                size={isTablet ? "small" : "default"}
                disabled={selectedRowKeys.length === 0}
              />
            </Tooltip> */}
          </Space>
        )}
      </div>

      {/* Summary Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={12} lg={12}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 8,
            }}
          >
            <Statistic
              title={
                <span style={{ color: "#fff", fontSize: isMobile ? 12 : 18 }}>
                  Tổng số sản phẩm
                </span>
              }
              value={summaryStats.totalProducts}
              prefix={<AppstoreOutlined style={{ color: "#fff" }} />}
              valueStyle={{
                color: "#fff",
                fontSize: isMobile ? 24 : 32,
                fontWeight: "bold",
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={12} lg={12}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              borderRadius: 8,
            }}
          >
            <Statistic
              title={
                <span style={{ color: "#fff", fontSize: isMobile ? 12 : 18 }}>
                  Tổng quỹ lương
                </span>
              }
              value={summaryStats.totalPayroll}
              prefix={<DollarOutlined style={{ color: "#fff" }} />}
              suffix={<span style={{ fontSize: isMobile ? 14 : 18 }}>VNĐ</span>}
              precision={0}
              valueStyle={{
                color: "#fff",
                fontSize: isMobile ? 24 : 32,
                fontWeight: "bold",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Selected items info for mobile */}
      {isMobile && selectedRowKeys.length > 0 && (
        <div
          style={{
            background: "#e6f7ff",
            padding: 8,
            borderRadius: 4,
            marginBottom: 12,
            fontSize: 12,
            textAlign: "center",
          }}
        >
          Đã chọn {selectedRowKeys.length} mục
        </div>
      )}

      {/* Filter Section */}
      {!isMobile && showFilters && (
        <div
          style={{
            background: "#fafafa",
            padding: 16,
            marginBottom: 20,
            borderRadius: 8,
            border: "1px solid #eee",
          }}
        >
          {renderFilterForm()}
        </div>
      )}

      {/* Table for desktop/tablet, Cards for mobile */}
      {isMobile ? (
        renderMobileCards()
      ) : (
        <Table
          rowSelection={rowSelection}
          columns={isMobile ? mobileColumns : columns}
          dataSource={dataSource}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: !isTablet,
            showQuickJumper: !isTablet,
            size: isTablet ? "small" : "default",
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} mục`,
          }}
          onChange={(pagination) => {
            fetchData(pagination.current, pagination.pageSize);
          }}
          bordered
          size={isTablet ? "small" : "default"}
          scroll={{ x: isMobile ? 600 : isTablet ? 800 : "max-content" }}
          components={{
            header: {
              cell: (props) => (
                <th
                  {...props}
                  style={{
                    backgroundColor: "#e6f4fb",
                    color: "#0700ad",
                    fontWeight: "600",
                    fontSize: isMobile ? 12 : 14,
                  }}
                />
              ),
            },
          }}
        />
      )}

      {/* Filter Drawer for Mobile */}
      <Drawer
        title="Lọc tìm kiếm"
        placement="bottom"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        height="80%"
      >
        {renderFilterForm()}
      </Drawer>

      {/* Modal */}
      <PayrollModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialValues={editingData}
      />

      <AssessmentModal
        open={assessmentModalVisible}
        onCancel={() => setAssessmentModalVisible(false)}
        onSubmit={handleAssessmentSubmit}
        record={selectedRecord}
      />

      <ViewAssessmentModal
        open={viewAssessmentModalVisible}
        onCancel={() => setViewAssessmentModalVisible(false)}
        record={selectedRecord}
      />
    </div>
  );
};

export default Payroll;
