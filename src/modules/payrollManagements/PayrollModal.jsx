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
import {
  addPayrollManager,
  updatePayrollManager,
} from "../../services/apiPayroll/Payroll";
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
      form.setFieldsValue(initialValues || {});
      const managerNames =
        initialValues.managers?.split(",").map((x) => x.trim()) || [];

      const managerValues = dataUser
        .filter((u) => managerNames.includes(u.label))
        .map((u) => u.value);

      form.setFieldsValue({
        ...initialValues,
        manager: managerValues,
      });
      if (initialValues?.payrollType) {
        setSalaryType(initialValues.payrollType);
      }
      getUser();
    }
  }, [open, initialValues, form]);

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

  const handleOk = () => {
    if (!initialValues) {
      form.validateFields().then(async (values) => {
        try {
          setLoading(true);

          // ===== BUILD MANAGERS =====
          const managers = values.manager.map((userName, index) => {
            const u = dataUser.find((x) => x.value === userName);

            return {
              userId: u?.id,
              userName: u?.value,
              fullName: u?.label,
              isPrimary: index === 0, // người đầu tiên là quản lý chính
            };
          });
          const payload = {
            ...values,
            nationalDefense: values.nationalDefense || 0,
            economy: values.economy || 0,
            nationalDefenseEconomy: values.nationalDefenseEconomy || 0,
            note: values.note || "",
            managers,
          };

          let res = await addPayrollManager(
            payload.productName,
            payload.nationalDefense,
            payload.economy,
            payload.nationalDefenseEconomy,
            payload.payrollType,
            payload.note,
            managers
          );
          if (res && res.status === 200) {
            const newFollowers = dataUser.find(
              (u) => u.value === user.data.userName
            );
            await addFollower(res.data.data, "Payroll", payload.productName, [
              {
                userId: newFollowers.id,
                userName: newFollowers.value,
                fullName: user.data.fullName,
              },
            ]);
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
        } finally {
          setLoading(false);
        }
      });
    } else {
      form.validateFields().then(async (values) => {
        try {
          setLoading(true);
          // ===== BUILD MANAGERS =====
          const managers = values.manager.map((userName, index) => {
            const u = dataUser.find((x) => x.value === userName);

            return {
              userId: u?.id,
              userName: u?.value,
              fullName: u?.label,
              isPrimary: index === 0, // người đầu tiên là quản lý chính
            };
          });
          const payload = {
            ...values,
            nationalDefense: values.nationalDefense || 0,
            economy: values.economy || 0,
            nationalDefenseEconomy: values.nationalDefenseEconomy || 0,
            note: values.note || "",
            managers,
          };

          let res = await updatePayrollManager(
            initialValues.id,
            payload.productName,
            payload.nationalDefense,
            payload.economy,
            payload.nationalDefenseEconomy,
            payload.payrollType,
            payload.note,
            managers
          );
          if (res && res.status === 200) {
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
        } finally {
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
          <span
            style={{
              fontSize: isMobile ? 18 : 25,
              fontWeight: 600,
            }}
          >
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
            {/* <Col span={colSpans.half}>
              <Form.Item
                name="documentNumber"
                label="Số chứng từ"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col> */}
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
                name="payrollType"
                label="Loại quỹ lương"
                rules={[
                  { required: true, message: "Vui lòng chọn loại quỹ lương" },
                ]}
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
                  <Select.Option value="nationalDefense">
                    Quốc phòng
                  </Select.Option>
                  <Select.Option value="economy">Kinh tế</Select.Option>
                  <Select.Option value="nationalDefenseEconomy">
                    Quốc phòng yếu tố kinh tế
                  </Select.Option>
                </Select>
              </Form.Item>
            </Col>
            {/* Lương Quốc phòng */}
            {salaryType === "nationalDefense" && (
              <Col span={colSpans.half}>
                <Form.Item
                  name="nationalDefense"
                  label="Lương Quốc phòng"
                  rules={[{ required: true, message: "Nhập lương quốc phòng" }]}
                >
                  <Input type="number" placeholder="Nhập lương quốc phòng" />
                </Form.Item>
              </Col>
            )}

            {/* Lương Kinh tế */}
            {salaryType === "economy" && (
              <Col span={colSpans.half}>
                <Form.Item
                  name="economy"
                  label="Lương Kinh tế"
                  rules={[{ required: true, message: "Nhập lương kinh tế" }]}
                >
                  <Input type="number" placeholder="Nhập lương kinh tế" />
                </Form.Item>
              </Col>
            )}

            {/* Lương Quốc phòng yếu tố kinh tế */}
            {salaryType === "nationalDefenseEconomy" && (
              <Col span={colSpans.half}>
                <Form.Item
                  name="nationalDefenseEconomy"
                  label="Lương Quốc phòng yếu tố kinh tế"
                  rules={[
                    {
                      required: true,
                      message: "Nhập lương quốc phòng yếu tố kinh tế",
                    },
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
