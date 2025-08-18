// MonthlyRepeatModal.jsx
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const MonthlyRepeatModal = ({ show, onHide, onSubmit }) => {
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [time, setTime] = useState("");

  const handleSubmit = () => {
    onSubmit({
      type: "monthly",
      dayOfMonth,
      time,
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Repeat Monthly</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Day of Month</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="31"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mt-3">
            <Form.Label>Time</Form.Label>
            <Form.Control
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>Save</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MonthlyRepeatModal;
