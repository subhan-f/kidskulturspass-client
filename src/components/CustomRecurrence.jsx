import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";

const CustomRecurrence = ({ show, handleClose, handleSave }) => {
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [repeatUnit, setRepeatUnit] = useState("week");
  const [selectedDays, setSelectedDays] = useState([]);
  const [endOption, setEndOption] = useState("never");
  const [endDate, setEndDate] = useState("");
  const [occurrences, setOccurrences] = useState(10);

  const days = [
    { label: "Montag", value: "MO" },
    { label: "Dienstag", value: "TU" },
    { label: "Mittwoch", value: "WE" },
    { label: "Donnerstag", value: "TH" },
    { label: "Freitag", value: "FR" },
    { label: "Samstag", value: "SA" },
    { label: "Sonntag", value: "SU" }
  ];

  const toggleDay = (dayValue) => {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  };

  const onSave = () => {
    const recurrenceRule = {
      repeatEvery: parseInt(repeatEvery),
      repeatUnit,
      selectedDays,
      endOption,
      endDate: endOption === "on" ? endDate : null,
      occurrences: endOption === "after" ? parseInt(occurrences) : null,
    };
    console.log("Recurrence Rule:", recurrenceRule);
    handleSave(recurrenceRule);
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Benutzerdefinierte Wiederholung</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Repeat Every */}
        <div className="d-flex align-items-center mb-3">
          <span className="me-2">Wiederhole alle</span>
          <input
            type="number"
            min="1"
            value={repeatEvery}
            onChange={(e) => setRepeatEvery(e.target.value)}
            className="form-control w-25 me-2"
          />
          <select
            value={repeatUnit}
            onChange={(e) => {
              setRepeatUnit(e.target.value);
              if (e.target.value !== 'week') setSelectedDays([]);
            }}
            className="form-select w-50"
          >
            <option value="day">Tage</option>
            <option value="week">Wochen</option>
            <option value="month">Monate</option>
            <option value="year">Jahre</option>
          </select>
        </div>

        {/* Repeat On - Only show for weekly */}
        {repeatUnit === 'week' && (
          <div className="mb-3">
            <span className="d-block mb-2">Wiederhole an</span>
            <div className="d-flex flex-wrap gap-2">
              {days.map((day, index) => (
                <button
                  key={index}
                  className={`btn btn-sm ${selectedDays.includes(day.value) ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Ends Section */}
        <div className="mb-3">
          <span className="d-block mb-2">Endet</span>
          <div className="form-check">
            <input
              type="radio"
              id="never"
              name="ends"
              value="never"
              checked={endOption === "never"}
              onChange={() => setEndOption("never")}
              className="form-check-input"
            />
            <label htmlFor="never" className="form-check-label">
              Nie
            </label>
          </div>

          <div className="form-check mt-2">
            <input
              type="radio"
              id="on"
              name="ends"
              value="on"
              checked={endOption === "on"}
              onChange={() => setEndOption("on")}
              className="form-check-input"
            />
            <label htmlFor="on" className="form-check-label">
              Am
            </label>
            {endOption === "on" && (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-control mt-2"
                min={new Date().toISOString().split('T')[0]}
              />
            )}
          </div>

          <div className="form-check mt-2">
            <input
              type="radio"
              id="after"
              name="ends"
              value="after"
              checked={endOption === "after"}
              onChange={() => setEndOption("after")}
              className="form-check-input"
            />
            <label htmlFor="after" className="form-check-label">
              Nach
            </label>
            {endOption === "after" && (
              <div className="d-flex align-items-center mt-2">
                <input
                  type="number"
                  min="1"
                  value={occurrences}
                  onChange={(e) => setOccurrences(e.target.value)}
                  className="form-control w-25 me-2"
                />
                <span>Wiederholungen</span>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Abbrechen
        </Button>
        <Button variant="primary" onClick={onSave}>
          Speichern
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CustomRecurrence;