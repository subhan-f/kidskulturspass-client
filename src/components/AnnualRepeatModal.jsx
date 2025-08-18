// AnnualRepeatModal.jsx
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const AnnualRepeatModal = ({ show, onHide, onSubmit }) => {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = () => {
    onSubmit({
      type: "annually",
      date,
      time,
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Repeat Annually</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Select Date</Form.Label>
            <Form.Control
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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

export default AnnualRepeatModal;
