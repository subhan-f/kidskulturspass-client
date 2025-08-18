// WeeklyRepeatModal.jsx
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const WeeklyRepeatModal = ({ show, onHide, onSubmit }) => {
  const [dayOfWeek, setDayOfWeek] = useState("monday");
  const [time, setTime] = useState("");

  const handleSubmit = () => {
    onSubmit({
      type: "weekly",
      dayOfWeek,
      time,
    });
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Repeat Weekly</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group>
            <Form.Label>Select Day</Form.Label>
            <Form.Select value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)}>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
              <option value="saturday">Saturday</option>
              <option value="sunday">Sunday</option>
            </Form.Select>
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

export default WeeklyRepeatModal;
