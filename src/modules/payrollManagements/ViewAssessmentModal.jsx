import React from "react";
import { Modal, Rate, Descriptions } from "antd";

const ViewAssessmentModal = ({
  open,
  onCancel,
  record,
}) => {
  const assessment = record?.assessment;

  return (
    <Modal
      title="Chi tiết đánh giá"
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      {!assessment ? (
        <p>Chưa có đánh giá</p>
      ) : (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Mức độ hài lòng">
            <Rate disabled value={assessment.rating} />
          </Descriptions.Item>

          <Descriptions.Item label="Nhận xét">
            {assessment.comment}
          </Descriptions.Item>

          <Descriptions.Item label="Người đánh giá">
            {assessment.assessor || "—"}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày đánh giá">
            {assessment.assessmentDate
              ? new Date(assessment.assessmentDate).toLocaleString("vi-VN")
              : "—"}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
};

export default ViewAssessmentModal;
