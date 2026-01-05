import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Row,
  Col,
  Typography,
  Button,
  Dropdown,
  Collapse,
  Table,
  Space,
  message,
  Modal,
  Grid,
} from "antd";
import {
  DownOutlined,
  EditOutlined,
  PaperClipOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import NoteSection from "../../components/NoteSection ";
import AttachmentSection from "../../components/AttachmentSection ";
import SystemSection from "../../components/SystemSection";
import PayrollModal from "./PayrollModal";
import {
  deletePayrollManager,
  getPayrollManagerByID,
  getEvaluationPayroll,
} from "../../services/apiPayroll/Payroll";
import dayjs from "dayjs";
import { addAttachments } from "../../services/apiAttachment";
import { useSelector } from "react-redux";
import { getApprovalsByRef } from "../../services/apiApprovals";
import { getApprovalSetting } from "../../services/apiApproveSetting";
import AssessmentModal from "./AssessmentModal";

const { Title } = Typography;
const { Panel } = Collapse;
const { useBreakpoint } = Grid;

const PayrollDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const type = queryParams.get("type");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalReviewOpen, setIsModalReviewOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [editingEvaluationData, setEditingEvaluationData] = useState(null);
  const [data, setData] = useState();
  const [refreshFlag, setRefreshFlag] = useState(0);
  const user = useSelector((state) => state.auth.login.currentUser);
  const navigator = useNavigate();
  const fileInputRef = useRef(null);
  const screens = useBreakpoint();
  const [evaluationRows, setEvaluationRows] = useState([]);

  // Determine if mobile/tablet view
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;

  useEffect(() => {
    getData();
  }, []);

  const getDetailPayroll = async (payrollId) => {
    try {
      const res = await getEvaluationPayroll(payrollId);
      const apiRows = (res.data.data || []).map((item) => ({
        key: item.id,
        id: item.id,
        period: dayjs(`${item.year}-${item.month}-01`).format("MM/YYYY"),
        score: item.score,
        salary: item.amount,
        note: item.comment,
      }));
      setEvaluationRows(apiRows);

      // ✅ KHÔNG recalculate khi load từ DB
    } catch (error) {
      message.error("Không tải được dữ liệu đánh giá");
    }
  };

  const getData = async () => {
    try {
      let res = await getPayrollManagerByID(id);
      if (res && res.status === 200) {
        setData(res.data.data);
        getDetailPayroll(res.data.data.id);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const items = [
    {
      key: "edit",
      label: (
        <span>
          <EditOutlined /> Sửa
        </span>
      ),
    },
    {
      key: "assessment",
      label: (
        <span>
          <CheckCircleOutlined /> Đánh giá
        </span>
      ),
    },
    {
      key: "attach",
      label: (
        <span>
          <PaperClipOutlined /> Đính kèm
        </span>
      ),
    },
    {
      key: "delete",
      label: (
        <span style={{ color: "red" }}>
          <DeleteOutlined /> Xóa
        </span>
      ),
    },
  ];

  const handleMenuClick = async ({ key }) => {
    if (key === "edit") {
      if (type) {
        setEditingData({
          ...data,
          type: type,
        });
      } else {
        setEditingData(data);
      }
      setIsModalOpen(true);
    } else if (key === "attach") {
      fileInputRef.current?.click();
    } else if (key === "delete") {
      try {
        let res = await deletePayrollManager(data.id);
        if ((res && res.status === 200) || res.status === 204) {
          Modal.success({
            title: "Xóa thành công",
            content: `Đã xóa thành công phiếu`,
          });
          navigator("/fn/payroll-managent");
        }
      } catch (error) {
        Modal.error({
          title: "Xóa thất bại",
          content: `Đã có lỗi xãy ra. Vui lòng thử lại sau`,
        });
      }
    }
    if (key === "assessment") {
      if (type) {
        setEditingEvaluationData({
          ...data,
          ...evaluationRows,
          type: type,
        });
      } else {
        setEditingEvaluationData(data);
      }
      setIsModalReviewOpen(true);
    }
  };

  // Responsive columns for table
  const getColumns = () => {
    const baseColumns = [
      {
        title: "STT",
        dataIndex: "stt",
        width: isMobile ? 50 : 60,
        fixed: isMobile ? "left" : false,
      },
      {
        title: "Đợt (Tháng/Năm)",
        dataIndex: "period",
        width: isMobile ? 200 : undefined,
        fixed: isMobile ? "left" : false,
      },
      {
        title: "Đánh giá (1–10)",
        dataIndex: "score",
        width: isMobile ? 80 : undefined,
      },
      {
        title: "Lương theo đánh giá (VNĐ)",
        dataIndex: "salary",
        width: isMobile ? 150 : undefined,
        render: (v) => v.toLocaleString("vi-VN"),
      },
      {
        title: "Nhận xét",
        dataIndex: "note",
        width: isMobile ? 150 : undefined,
      },
    ];

    return baseColumns;
  };

  const formatMoney = (value) => {
    if (value === null || value === undefined) return "";
    return Number(value).toLocaleString("vi-VN");
  };

  // Responsive info rendering
  const renderInfoSection = () => {
    if (isMobile) {
      return (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <strong>Tên sản phẩm:</strong> {data.productName || ""}
          </div>
          <div>
            <strong>Quốc phòng:</strong> {formatMoney(data.nationalDefense)} vnđ
          </div>
          <div>
            <strong>Kinh tế:</strong> {formatMoney(data.economy)} vnđ
          </div>
          <div>
            <strong>Quốc phòng yếu tố kinh tế:</strong>{" "}
            {formatMoney(data.nationalDefenseEconomy)} vnđ
          </div>
          <div>
            <strong>Quỹ lương còn lại:</strong>{" "}
            {formatMoney(data.remainingFund)} vnđ
          </div>

          <div>
            <strong>Người quản lý:</strong> {data.managers || ""}
          </div>
          <div>
            <strong>Ghi chú:</strong> {data.note || ""}
          </div>
        </Space>
      );
    }

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <div>
              <strong>Tên sản phẩm:</strong> {data.productName || ""}
            </div>
            <div>
              <strong>Quốc phòng:</strong> {formatMoney(data.nationalDefense)}{" "}
              vnđ
            </div>
            <div>
              <strong>Kinh tế:</strong> {formatMoney(data.economy)} vnđ
            </div>
            <div>
              <strong>Quốc phòng yếu tố kinh tế:</strong>{" "}
              {formatMoney(data.nationalDefenseEconomy)} vnđ
            </div>
          </Space>
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <div>
              <strong>Quỹ lương còn lại:</strong>{" "}
              {formatMoney(data.remainingFund)} vnđ
            </div>
            <div>
              <strong>Người quản lý:</strong> {data.managers || ""}
            </div>
            <div>
              <strong>Ghi chú:</strong> {data.note || ""}
            </div>
          </Space>
        </Col>
      </Row>
    );
  };

  return (
    <div
      style={{
        padding: isMobile ? 8 : 16,
        minHeight: "100vh",
      }}
    >
      <Row justify="space-between" align="middle" gutter={[16, 16]}>
        <Col xs={24} sm={16} md={18} lg={20}>
          <Title
            level={isMobile ? 4 : 3}
            style={{
              margin: 0,
              fontSize: isMobile ? "18px" : undefined,
            }}
          >
            Xem chi tiết đánh giá quỹ lương
          </Title>
        </Col>
        <Col xs={24} sm={8} md={6} lg={4}>
          <Dropdown
            menu={{ items, onClick: handleMenuClick }}
            trigger={["click"]}
            placement={isMobile ? "bottomRight" : "bottom"}
          >
            <Button
              style={{ width: isMobile ? "100%" : "auto" }}
              size={isMobile ? "middle" : "middle"}
            >
              Hoạt động <DownOutlined />
            </Button>
          </Dropdown>
        </Col>
      </Row>

      <Collapse
        defaultActiveKey={["1"]}
        style={{ marginTop: 16 }}
        expandIconPosition="end"
        size={isMobile ? "small" : "middle"}
      >
        <Panel header="Thông tin quỹ lương" key="1">
          {data && <>{renderInfoSection()}</>}
        </Panel>

        <Panel header="Nội dung đánh giá" key="2">
          {data && (
            <div style={{ overflowX: "auto" }}>
              <Table
                columns={getColumns()}
                dataSource={evaluationRows?.map((item, index) => ({
                  ...item,
                  stt: index + 1,
                }))}
                scroll={{
                  x: isMobile ? 600 : "max-content",
                  y: isMobile ? 300 : undefined,
                }}
                size="small"
                bordered
                pagination={false}
                components={{
                  header: {
                    cell: (props) => (
                      <th
                        {...props}
                        style={{
                          backgroundColor: "#e6f4fb",
                          color: "#0700ad",
                          fontWeight: "600",
                          fontSize: isMobile ? "12px" : "14px",
                        }}
                      />
                    ),
                  },
                }}
                style={{
                  fontSize: isMobile ? "12px" : "14px",
                }}
              />
            </div>
          )}
        </Panel>

        <Panel header="Đính kèm" key="3">
          <AttachmentSection
            refId={data ? data.id : ""}
            refType={"Payroll"}
            refreshTrigger={refreshFlag}
          />
        </Panel>

        <Panel header="Ghi chú" key="4">
          <NoteSection
            refId={data ? data.id : ""}
            refType={"Payroll"}
            voucherNo={data ? data.documentNumber : ""}
          />
        </Panel>

        <Panel header="Hệ thống" key="5">
          {data && (
            <SystemSection
              systemInfo={{
                createdBy: `${data.createdBy}`,
                createdAt: data.createdAt
                  ? dayjs(data.createdAt).format("DD/MM/YYYY HH:mm:ss")
                  : "",
                updatedBy: `${data.updatedBy}`,
                updatedAt: data.updatedAt
                  ? dayjs(data.updatedAt).format("DD/MM/YYYY HH:mm:ss")
                  : "",
              }}
              refId={data.id}
              refType={"Payroll"}
              voucherNo={data.productName || ""}
            />
          )}
        </Panel>
      </Collapse>

      <PayrollModal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={() => {
          getData();
          setIsModalOpen(false);
        }}
        initialValues={editingData}
      />

      <AssessmentModal
        open={isModalReviewOpen}
        onCancel={() => setIsModalReviewOpen(false)}
        onSubmit={() => {
          getData();
          setIsModalReviewOpen(false);
        }}
        initialValues={editingEvaluationData}
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        multiple
        onChange={async (e) => {
          const files = e.target.files;
          if (!files.length || !data?.id) return;

          for (const file of files) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("refId", data.id);
            formData.append("refType", "Payroll");

            try {
              const res = await addAttachments(formData, user.data.token);
              message.success(`Đã upload file: ${file.name}`);
            } catch (err) {
              console.error(err);
              message.error(`Upload thất bại: ${file.name}`);
            }
          }

          e.target.value = "";
          setRefreshFlag((prev) => prev + 1);
        }}
      />
    </div>
  );
};

export default PayrollDetail;
