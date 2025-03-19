import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas'; // Import html2canvas

// Define therapist names
const therapists = [
  "Dominic Yeo", "Kirsty Png", "Soon Jiaying", 
  "Andrew Lim", "Janice Leong", "Oliver Tan"
];

// Blocked days (in YYYY-MM-DD format)
const blockedDays = [
  "2025-01-01", "2025-01-29", "2025-01-30", // New Year’s Day, Chinese New Year
  "2025-03-31", "2025-04-18", "2025-05-01", // Hari Raya Puasa, Good Friday, Labour Day
  "2025-05-12", "2025-06-07", "2025-08-09", // Vesak Day, Hari Raya Haji, National Day
  "2025-10-20", "2025-12-25"  // Deepavali, Christmas Day
];

// Helper function to get the dates for each month in 2025 with unique keys
const get2025Calendar = () => {
  const months = [
    [31, 'January'], [28, 'February'], [31, 'March'], [30, 'April'],
    [31, 'May'], [30, 'June'], [31, 'July'], [31, 'August'],
    [30, 'September'], [31, 'October'], [30, 'November'], [31, 'December']
  ];

  const calendar = months.map(([days, month], monthIndex) => {
    const monthDays = Array.from({ length: days }, (_, dayIndex) => {
      const date = new Date(2025, monthIndex, dayIndex + 1);
      const dayKey = `${2025}-${monthIndex + 1}-${dayIndex + 1}`; // Unique day identifier (YYYY-MM-DD)
      return {
        date,
        dayKey, // Use dayKey as the unique identifier
        therapists: []
      };
    });
    return monthDays;
  });

  return calendar;
};

const calendarData = get2025Calendar(); // Initialize full 2025 calendar

// Therapist Component (Draggable)
const Therapist = ({ name }) => {
  const [, drag] = useDrag(() => ({
    type: 'THERAPIST',
    item: { name }
  }));

  return (
    <div ref={drag} style={{ padding: '10px', margin: '5px', backgroundColor: 'lightblue', cursor: 'move' }}>
      {name}
    </div>
  );
};

// Calendar Day (Drop Zone)
const CalendarDay = ({ day, moveTherapist, removeTherapist, isToday, isBlocked }) => {
  const [, drop] = useDrop(() => ({
    accept: 'THERAPIST',
    drop: (item) => {
      if (!isBlocked) {
        moveTherapist(item.name, day.dayKey); // Only move if the day is not blocked
      }
    }
  }));

  return (
    <div
      ref={drop}
      style={{
        border: '1px solid #ddd',
        padding: '10px',
        minHeight: '80px',
        position: 'relative',
        backgroundColor: isToday ? '#FFEB3B' : isBlocked ? '#D3D3D3' : 'white' // Highlight today's date or blocked days
      }}
    >
      <strong>{day.date.toDateString()}</strong>
      {day.therapists.length > 0 ? (
        day.therapists.map((therapist, idx) => (
          <div key={idx} style={{ padding: '5px', backgroundColor: 'lightgreen' }}>
            {therapist}
            <button 
              onClick={() => removeTherapist(therapist, day.dayKey)} 
              style={{ marginLeft: '10px', color: 'red', cursor: 'pointer' }}
            >
              Remove
            </button>
          </div>
        ))
      ) : (
        <div style={{ color: 'gray' }}>No therapist assigned</div>
      )}
    </div>
  );
};

// Calendar Grid Component
const Calendar = ({ monthDays, moveTherapist, removeTherapist, todayDate }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginTop: '20px' }}>
      {monthDays.map((day) => {
        const isToday = todayDate && day.date.toDateString() === todayDate.toDateString();
        const isBlocked = blockedDays.includes(day.dayKey); // Check if the day is blocked
        return (
          <CalendarDay 
            key={day.dayKey}
            day={day}
            moveTherapist={moveTherapist} 
            removeTherapist={removeTherapist} 
            isToday={isToday} 
            isBlocked={isBlocked} // Pass isBlocked as a prop
          />
        );
      })}
    </div>
  );
};

const App = () => {
  const [currentMonth, setCurrentMonth] = useState(0); // Start with January (index 0)
  const [calendar, setCalendar] = useState(calendarData); // Store entire calendar state
  const [todayDate, setTodayDate] = useState(null); // For tracking today's date

  // Get the current date
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Set today's date when "Today" button is clicked
  const goToToday = () => {
    setCurrentMonth(currentMonthIndex); // Set to current month
    setTodayDate(new Date(currentYear, currentMonthIndex, currentDay)); // Set today's date
  };

  // Handle moving a therapist into a calendar day
  const moveTherapist = (name, dayKey) => {
    setCalendar(prevCalendar => {
      const updatedCalendar = prevCalendar.map((month, index) => {
        if (index === currentMonth) {
          return month.map(day => {
            if (day.dayKey === dayKey && !blockedDays.includes(dayKey)) {
              if (!day.therapists.includes(name)) {
                return { ...day, therapists: [...day.therapists, name] };
              }
            }
            return day;
          });
        }
        return month;
      });
      return updatedCalendar;
    });
  };

  // Handle removing a therapist from a calendar day
  const removeTherapist = (name, dayKey) => {
    setCalendar(prevCalendar => {
      const updatedCalendar = prevCalendar.map((month, index) => {
        if (index === currentMonth) {
          return month.map(day => {
            if (day.dayKey === dayKey) {
              return { ...day, therapists: day.therapists.filter(therapist => therapist !== name) };
            }
            return day;
          });
        }
        return month;
      });
      return updatedCalendar;
    });
  };

  // Reset the calendar to its original unassigned state
  const resetCalendar = () => {
    setCalendar(calendarData); // Reset the calendar state to its initial state
  };

  // Function to save the calendar as PNG
  const saveAsPNG = () => {
    html2canvas(document.querySelector("#calendar-container")).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'calendar.png'; // Set the name of the file
      link.click(); // Trigger the download
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
        <div>
          <h2>Therapists</h2>
          {therapists.map((name, index) => (
            <Therapist key={index} name={name} />
          ))}
        </div>

        <div>
          <h2>2025 Calendar - {calendar[currentMonth][0].date.toLocaleString('default', { month: 'long' })}</h2>
          <div>
            <button onClick={() => setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1))} style={{ marginRight: '10px' }}>←</button>
            <button onClick={() => setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1))} style={{ marginLeft: '10px' }}>→</button>
            <button onClick={goToToday} style={{ marginLeft: '20px' }}>Today</button>
            <button onClick={resetCalendar} style={{ marginLeft: '20px' }}>Reset Calendar</button>
            <button onClick={saveAsPNG} style={{ marginLeft: '20px' }}>Save as PNG</button>
          </div>

          <div id="calendar-container">
            <Calendar 
              monthDays={calendar[currentMonth]} 
              moveTherapist={moveTherapist} 
              removeTherapist={removeTherapist} 
              todayDate={todayDate} 
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;












































