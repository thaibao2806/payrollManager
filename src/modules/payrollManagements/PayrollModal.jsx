import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Row,
  Col,
  Table,
  Button,
  Space,
  Tooltip,
  notification,
  Select,
  Drawer,
} from "antd";
import { DeleteOutlined, PlusOutlined, TableOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  addAssignmentSlip,
  updateAssignmentSlip,
} from "../../services/apiPlan/apiAssignmentSlip";
import { getDocumentNumber } from "../../services/apiAutoNumbering";
import { getApprovalSetting } from "../../services/apiApproveSetting";
import { getAllUser } from "../../services/apiAuth";
import {
  createApprovals,
  getApprovalsByRef,
  updateStatusApprovals,
} from "../../services/apiApprovals";
import { useSelector } from "react-redux";
import { addFollower } from "../../services/apiFollower";
dayjs.extend(customParseFormat);

const approvalStatusOptions = [
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

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

const PayrollModal = ({ open, onCancel, onSubmit, initialValues }) => {
  const [form] = Form.useForm();
  const [monthYear, setMonthYear] = useState(dayjs());
  const [tableData, setTableData] = useState([]);
  const [approvalNumber, setApprovalNumber] = useState();
  const [approvers, setApprovers] = useState([]);
  const [dataUser, setDataUser] = useState([]);
  const [isEditApproval, setIsEditApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableDrawerVisible, setTableDrawerVisible] = useState(false);
  const user = useSelector((state) => state.auth.login?.currentUser);
  const [salaryType, setSalaryType] = useState(null);
  const { width } = useWindowSize();

  // Responsive breakpoints
  const isMobile = width <= 768;
  const isTablet = width > 768 && width <= 1024;
  const isDesktop = width > 1024;

  useEffect(() => {
    if (open) {
      if (!initialValues) {
        //getVoucherNo();
      }

      form.setFieldsValue(initialValues || {});
      setIsEditApproval(!!initialValues?.type);
      setMonthYear(dayjs(initialValues?.documentDate || dayjs()));
      if (initialValues?.details?.length) {
        const daysInMonth = dayjs(initialValues.documentDate).daysInMonth();
        const columns = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const formattedDetails = initialValues.details.map((item, index) => ({
          key: `${Date.now()}_${index}`,
          stt: index + 1,
          content: item.content || "",
          unit: item.unit || "",
          quantity: item.quantity || "",
          workDay: item.workDay || "",
          note: item.note || "",
          ...columns.reduce((acc, day) => {
            acc[`d${day}`] = item[`d${day}`] || "";
            return acc;
          }, {}),
        }));

        setTableData(formattedDetails);
      } else {
        setTableData([]);
      }
      getApprovalByModulePage();
      getUser();
      if (initialValues) {
        getApprovals(initialValues.id);
      }
    }
  }, [open, initialValues, form]);

  useEffect(() => {
    if (open && !initialValues && approvalNumber > 0) {
      setApprovers(Array(approvalNumber).fill({ userName: null }));
    }
  }, [approvalNumber, open, initialValues]);

  const getApprovals = async (refId) => {
    try {
      let res = await getApprovalsByRef(refId, "PGV");
      if (res && res.status === 200) {
        const list = res.data.data.map((ap) => ({
          id: ap.id,
          username: ap.userName,
          status: ap.status,
          note: ap.note,
        }));
        setApprovers(list);
        form.setFieldsValue({ approvers: list });
      }
    } catch (error) {}
  };

  const getUser = async () => {
    try {
      let res = await getAllUser();
      if (res && res.status === 200) {
        const options = res.data.data.map((user) => ({
          id: user.apk,
          value: user.userName,
          label: user.fullName || user.userName,
        }));
        setDataUser(options);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getApprovalByModulePage = async () => {
    try {
      let res = await getApprovalSetting("PL", "pl-phieu-giao-viec");
      if (res && res.status === 200) {
        setApprovalNumber(res.data.data.approvalNumber);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getVoucherNo = async () => {
    try {
      let res = await getDocumentNumber("PGV");
      if (res && res.status === 200) {
        form.setFieldsValue({ documentNumber: res.data.data.code });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleMonthChange = (date) => {
    setMonthYear(date);
    if (!date) return;

    const daysInMonth = date.daysInMonth();
    const columns = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const handleAddRow = () => {
    const daysInMonth = monthYear?.daysInMonth() || 0;
    const newKey = `${Date.now()}`;
    const columns = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const newRow = {
      key: newKey,
      stt: tableData.length + 1,
      ...columns.reduce((acc, day) => {
        acc[`d${day}`] = "";
        return acc;
      }, {}),
    };
    setTableData((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (key) => {
    setTableData((prev) => prev.filter((item) => item.key !== key));
  };

  const handleInputChange = (key, field, value) => {
    setTableData((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, [field]: value } : item
      )
    );
  };

  const generateColumns = () => {
    const baseColumns = [
      {
        title: "",
        dataIndex: "action",
        width: isMobile ? 35 : 40,
        fixed: isMobile ? "left" : false,
        render: (_, record) => (
          <Tooltip title="Xóa dòng">
            <Button
              icon={<DeleteOutlined />}
              size={isMobile ? "small" : "small"}
              danger
              onClick={() => handleDeleteRow(record.key)}
            />
          </Tooltip>
        ),
      },
      {
        title: "STT",
        dataIndex: "stt",
        width: isMobile ? 45 : 50,
        fixed: isMobile ? "left" : false,
      },
      {
        title: "Nội dung",
        dataIndex: "content",
        width: isMobile ? 150 : 200,
        render: (_, record) => (
          <Input
            value={record.content}
            size={isMobile ? "small" : "default"}
            onChange={(e) =>
              handleInputChange(record.key, "content", e.target.value)
            }
          />
        ),
      },
      {
        title: "ĐVT",
        dataIndex: "unit",
        width: isMobile ? 80 : 100,
        render: (_, record) => (
          <Input
            value={record.unit}
            size={isMobile ? "small" : "default"}
            onChange={(e) =>
              handleInputChange(record.key, "unit", e.target.value)
            }
          />
        ),
      },
      {
        title: "Số lượng",
        dataIndex: "quantity",
        width: isMobile ? 90 : 120,
        render: (_, record) => (
          <Input
            value={record.quantity}
            size={isMobile ? "small" : "default"}
            onChange={(e) =>
              handleInputChange(record.key, "quantity", e.target.value)
            }
          />
        ),
      },
      {
        title: "N/Công",
        dataIndex: "workDay",
        width: isMobile ? 80 : 100,
        render: (_, record) => (
          <Input
            value={record.workDay}
            size={isMobile ? "small" : "default"}
            onChange={(e) =>
              handleInputChange(record.key, "workDay", e.target.value)
            }
          />
        ),
      },
      {
        title: "Ghi chú",
        dataIndex: "note",
        width: isMobile ? 120 : 150,
        render: (_, record) => (
          <Input
            value={record.note}
            size={isMobile ? "small" : "default"}
            onChange={(e) =>
              handleInputChange(record.key, "note", e.target.value)
            }
          />
        ),
      },
    ];

    return baseColumns;
  };

  const handleAddApprovals = async (refId, documentNumber) => {
    try {
      const approversData = form.getFieldValue("approvers") || [];

      const formattedApprovers = approversData.map((item, index) => {
        const user = dataUser.find((u) => u.value === item.username);
        return {
          userName: item.username,
          fullName: user?.label || "",
          level: index + 1,
        };
      });

      const res = await createApprovals(
        refId,
        "PGV",
        formattedApprovers,
        documentNumber,
        `/pl/phieu-giao-viec-chi-tiet/${refId}?type=PGV`
      );
      if (res && res.status === 200) {
        console.log("Tạo danh sách duyệt thành công");
      }
    } catch (error) {
      console.error("Lỗi khi tạo duyệt:", error);
    }
  };

  const handleUpdateApprovals = async () => {
    try {
      const approversData = form.getFieldValue("approvers") || [];
      const updatePromises = approversData.map((item) => {
        if (item.id) {
          return updateStatusApprovals(item.id, item.status, item.note);
        }
        return null;
      });

      const responses = await Promise.all(updatePromises.filter(Boolean));
    } catch (error) {
      console.error("Lỗi cập nhật phê duyệt:", error);
      notification.error({
        message: "Cập nhật thất bại",
        description: "Có lỗi xảy ra khi cập nhật trạng thái duyệt.",
      });
    }
  };

  const handleOk = () => {
    if (!initialValues) {
      form.validateFields().then(async (values) => {
        try {
          setLoading(true);
          const payload = {
            ...values,
            documentDate: monthYear.toISOString(),
            note: values.note || "",
            details: tableData.map((item) => ({
              content: item.content || "",
              unit: item.unit || "",
              quantity: Number(item.quantity) || 0,
              workDay: Number(item.workDay) || 0,
              note: item.note || "",
            })),
          };

          let res = await addPayroll(
            payload.documentNumber,
            payload.productName,
            payload.documentDate,
            payload.department,
            payload.managementUnit,
            payload.note,
            payload.details
          );
          if (res && res.status === 200) {
            await handleAddApprovals(res.data.data, payload.documentNumber);
            const newFollowers = dataUser.find(u => u.value === user.data.userName);
            await addFollower(
              res.data.data,
              "Payroll",
               payload.documentNumber,
               [
                {
                  userId: newFollowers.id,
                  userName: newFollowers.value,
                  fullName: user.data.fullName,
                }
              ]
            )
            onSubmit();
            form.resetFields();
            setMonthYear(dayjs());
            setTableData([]);
            notification.success({
              message: "Thành công",
              description: "Lưu phiếu thành công.",
              placement: isMobile ? "top" : "topRight",
            });
          }
        } catch (error) {
          if (error) {
            console.log(error);
            notification.error({
              message: "Thất bại",
              description: "Đã có lỗi xảy ra. Vui lòng thử lại",
              placement: isMobile ? "top" : "topRight",
            });
          }
        }
        finally{
          setLoading(false);
        }
      });
    } else {
      form.validateFields().then(async (values) => {
        try {
          setLoading(true);
          const payload = {
            ...values,
            documentDate: monthYear.toISOString(),
            note: values.note || "",
            details: tableData.map((item) => ({
              content: item.content || "",
              unit: item.unit || "",
              quantity: Number(item.quantity) || 0,
              workDay: Number(item.workDay) || 0,
              note: item.note || "",
            })),
          };

          let res = await updatePayroll(
            initialValues.id,
            payload.documentNumber,
            payload.productName,
            payload.documentDate,
            payload.department,
            payload.managementUnit,
            payload.note,
            payload.details
          );
          if (res && res.status === 200) {
            if (isEditApproval) {
              await handleUpdateApprovals();
            }
            onSubmit();
            form.resetFields();
            setMonthYear(dayjs());
            setTableData([]);
            notification.success({
              message: "Thành công",
              description: "Lưu phiếu thành công.",
              placement: isMobile ? "top" : "topRight",
            });
          }
        } catch (error) {
          if (error) {
            notification.error({
              message: "Thất bại",
              description: "Đã có lỗi xảy ra. Vui lòng thử lại",
              placement: isMobile ? "top" : "topRight",
            });
          }
        } finally{
          setLoading(false);
        }
      });
    }
  };

  // Determine modal width and layout
  const getModalWidth = () => {
    if (isMobile) return "95%";
    if (isTablet) return 800;
    return 1000;
  };

  const getColSpans = () => {
    if (isMobile) return { main: 24, half: 24 };
    if (isTablet) return { main: 24, half: 12 };
    return { main: 24, half: 12 };
  };

  const colSpans = getColSpans();

  return (
    <>
      <Modal
        title={
          <span style={{ 
            fontSize: isMobile ? 18 : 25, 
            fontWeight: 600 
          }}>
            {initialValues ? "Cập nhật phương tiện" : "Thêm phương tiện"}
          </span>
        }
        open={open}
        onCancel={() => {
          form.resetFields();
          setMonthYear(dayjs());
          setTableData([]);
          setTableDrawerVisible(false);
          onCancel();
        }}
        onOk={handleOk}
        okText={initialValues ? "Cập nhật" : "Thêm"}
        width={getModalWidth()}
        confirmLoading={loading}
        style={isMobile ? { top: 20 } : {}}
        bodyStyle={isMobile ? { padding: "16px" } : {}}
      >
        <Form 
          form={form} 
          layout="vertical"
          size={isMobile ? "small" : "default"}
        >
          <Row gutter={isMobile ? [8, 8] : [16, 16]}>
            <Col span={colSpans.half}>
              <Form.Item
                name="documentNumber"
                label="Số chứng từ"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={colSpans.half}>
              <Form.Item
                name="productName"
                label="Tên sản phẩm"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={colSpans.half}>
                <Form.Item
                  name="economy"
                  label="Loại quỹ lương"
                  rules={[{ required: true, message: "Vui lòng chọn loại quỹ lương" }]}
                >
                  <Select
                    placeholder="Chọn loại quỹ lương"
                    onChange={(value) => {
                      setSalaryType(value);

                      // Reset toàn bộ lương khi đổi loại
                      form.setFieldsValue({
                        nationalDefenseSalary: null,
                        economySalary: null,
                        nationalDefenseEconomySalary: null,
                      });
                    }}
                  >
                    <Select.Option value="quoc-phong">Quốc phòng</Select.Option>
                    <Select.Option value="kinh-te">Kinh tế</Select.Option>
                    <Select.Option value="quoc-phong-kinh-te">
                      Quốc phòng yếu tố kinh tế
                    </Select.Option>
                  </Select>
                </Form.Item>

            </Col>
            {/* Lương Quốc phòng */}
            {(salaryType === "quoc-phong" ) && (
              <Col span={colSpans.half}>
                <Form.Item
                  name="nationalDefenseSalary"
                  label="Lương Quốc phòng"
                  rules={[{ required: true, message: "Nhập lương quốc phòng" }]}
                >
                  <Input
                    type="number"
                    placeholder="Nhập lương quốc phòng"
                  />
                </Form.Item>
              </Col>
            )}

            {/* Lương Kinh tế */}
            {(salaryType === "kinh-te" ) && (
              <Col span={colSpans.half}>
                <Form.Item
                  name="economySalary"
                  label="Lương Kinh tế"
                  rules={[{ required: true, message: "Nhập lương kinh tế" }]}
                >
                  <Input
                    type="number"
                    placeholder="Nhập lương kinh tế"
                  />
                </Form.Item>
              </Col>
            )}

            {/* Lương Quốc phòng yếu tố kinh tế */}
            {salaryType === "quoc-phong-kinh-te" && (
              <Col span={colSpans.half}>
                <Form.Item
                  name="nationalDefenseEconomySalary"
                  label="Lương Quốc phòng yếu tố kinh tế"
                  rules={[
                    { required: true, message: "Nhập lương quốc phòng yếu tố kinh tế" },
                  ]}
                >
                  <Input
                    type="number"
                    placeholder="Nhập lương quốc phòng yếu tố kinh tế"
                  />
                </Form.Item>
              </Col>
            )}


            <Col span={colSpans.half}>
              <Form.Item
                name="manager"
                label="Người quản lý"
                rules={[{ required: true }]}
              >
                <Select
                          options={dataUser}
                          placeholder="Chọn người quản lý"
                          showSearch
                          optionFilterProp="label"
                          disabled={!!initialValues}
                          mode="multiple"
                        />
              </Form.Item>
            </Col>
            <Col span={colSpans.half}>
              <Form.Item name="note" label="Ghi chú">
                <Input.TextArea rows={1} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </>
  );
};

export default PayrollModal;