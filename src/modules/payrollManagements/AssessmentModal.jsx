import React, { useEffect, useState } from "react";
import {
  Modal,
  Table,
  Button,
  InputNumber,
  DatePicker,
  Space,
  Descriptions,
  Input,
  Alert,
  message,
  Spin,
} from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import {
  getEvaluationPayroll,
  addEvaluationPayroll,
} from "../../services/apiPayroll/Payroll";

const { TextArea } = Input;

const AssessmentModal = ({
  open,
  onCancel,
  record,
  onSubmit,
  initialValues,
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [displayData, setDisplayData] = useState(null);

  /** =========================
   *  TỔNG QUỸ LƯƠNG
   ========================== */
  const totalBudget =
    Number(displayData?.nationalDefense || 0) +
    Number(displayData?.economy || 0) +
    Number(displayData?.nationalDefenseEconomy || 0);

  /** =========================
   *  CORE LOGIC TÍNH TOÁN
   *  - Đợt sau = Q × điểm × 10% − tổng các đợt trước
   *  - Không cho âm
   ========================== */
  const recalculateRows = (inputRows) => {
    let accumulated = 0;

    return inputRows.map((row) => {
      const expectedSalary = totalBudget * row.score * 0.1;
      let salary = expectedSalary - accumulated;

      if (salary < 0) salary = 0;

      accumulated += salary;

      return {
        ...row,
        salary,
      };
    });
  };

  /** =========================
   *  LOAD DỮ LIỆU TỪ API
   ========================== */
  useEffect(() => {
    if (!initialValues) {
      if (!open || !record?.id) return;
      fetchData(record.id);
      setDisplayData(record);
    } else {
      fetchData(initialValues.id);
      setDisplayData(initialValues);
    }
  }, [open, record]);

  const fetchData = async (id) => {
    setLoading(true);

    try {
      const res = await getEvaluationPayroll(id);
      const apiRows = (res.data.data || []).map((item) => ({
        key: item.id,
        id: item.id,
        period: dayjs(`${item.year}-${item.month}-01`),
        score: item.score,
        salary: item.amount,
        note: item.comment,
      }));
      console.log("API Rows:", apiRows);

      // ✅ KHÔNG recalculate khi load từ DB
      setRows(apiRows);
    } catch (error) {
      message.error("Không tải được dữ liệu đánh giá");
    } finally {
      setLoading(false);
    }
  };

  /** =========================
   *  TỔNG & CÒN LẠI
   ========================== */
  const totalUsedBudget = rows.reduce((sum, r) => sum + (r.salary || 0), 0);
  const remainingBudget = Math.max(totalBudget - totalUsedBudget, 0);

  /** =========================
   *  HANDLERS
   ========================== */
  const handleAddRow = () => {
    if (remainingBudget === 0) return;

    const newRows = [
      ...rows,
      {
        key: Date.now(),
        period: dayjs(),
        score: 1,
        salary: 0,
        note: "",
      },
    ];

    setRows(recalculateRows(newRows));
  };

  const handleRemoveRow = (key) => {
    const updated = rows.filter((r) => r.key !== key);
    setRows(recalculateRows(updated));
  };

  const handleChangeRow = (key, field, value) => {
    const updated = rows.map((r) =>
      r.key === key ? { ...r, [field]: value } : r
    );
    setRows(recalculateRows(updated));
  };

  /** =========================
   *  SUBMIT (POST API)
   ========================== */
  const handleOk = async () => {
    try {
      setLoading(true);

      for (const r of rows) {
        await addEvaluationPayroll(
          displayData.id,
          r.period.year(),
          r.period.month() + 1,
          r.score,
          r.salary,
          r.note
        );
      }
      onSubmit();
      message.success("Lưu đánh giá thành công");
      onCancel();
    } catch (error) {
      message.error("Lưu đánh giá thất bại");
    } finally {
      setLoading(false);
    }
  };

  /** =========================
   *  TABLE COLUMNS
   ========================== */
  const columns = [
    {
      title: "Đợt (Tháng/Năm)",
      dataIndex: "period",
      width: 160,
      render: (_, r) => (
        <DatePicker
          picker="month"
          value={r.period}
          onChange={(v) => handleChangeRow(r.key, "period", v)}
        />
      ),
    },
    {
      title: "Đánh giá (1–10)",
      dataIndex: "score",
      width: 150,
      render: (_, r) => (
        <InputNumber
          min={1}
          max={10}
          value={r.score}
          onChange={(v) => handleChangeRow(r.key, "score", v)}
        />
      ),
    },
    {
      title: "Lương theo đánh giá (VNĐ)",
      dataIndex: "salary",
      width: 200,
      render: (v) => v.toLocaleString("vi-VN"),
    },
    {
      title: "Nhận xét",
      dataIndex: "note",
      render: (_, r) => (
        <TextArea
          rows={1}
          value={r.note}
          onChange={(e) => handleChangeRow(r.key, "note", e.target.value)}
        />
      ),
    },
    {
      title: "",
      width: 60,
      render: (_, r) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveRow(r.key)}
        />
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Lưu đánh giá"
      cancelText="Hủy"
      width={1000}
      destroyOnClose
      confirmLoading={loading}
      title={`Đánh giá chất lượng - ${record?.productName || ""}`}
    >
      <Spin spinning={loading}>
        {/* ===== THÔNG TIN CHUNG ===== */}
        <Descriptions
          bordered
          size="small"
          column={2}
          style={{ marginBottom: 16 }}
        >
          <Descriptions.Item label="Tên sản phẩm">
            {displayData?.productName}
          </Descriptions.Item>
          <Descriptions.Item label="Người phụ trách">
            {displayData?.managers}
          </Descriptions.Item>
          <Descriptions.Item label="Quỹ lương">
            {totalBudget.toLocaleString("vi-VN")} VNĐ
          </Descriptions.Item>
          <Descriptions.Item label="Quỹ lương còn lại">
            <b style={{ color: remainingBudget > 0 ? "#52c41a" : "#ff4d4f" }}>
              {remainingBudget.toLocaleString("vi-VN")} VNĐ
            </b>
          </Descriptions.Item>
        </Descriptions>

        {/* ===== CẢNH BÁO ===== */}
        {remainingBudget === 0 && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Quỹ lương đã được phân bổ hết, không thể thêm đợt đánh giá mới"
          />
        )}

        {/* ===== ACTION ===== */}
        <Space style={{ marginBottom: 8 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddRow}
            disabled={remainingBudget === 0}
          >
            Thêm đợt đánh giá
          </Button>
        </Space>

        {/* ===== TABLE ===== */}
        <Table
          rowKey="key"
          columns={columns}
          dataSource={rows}
          pagination={false}
          bordered
          size="small"
        />
      </Spin>
    </Modal>
  );
};

export default AssessmentModal;
