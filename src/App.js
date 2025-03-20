import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';

// Define therapist names
const therapists = [
  "Dominic Yeo", "Kirsty Png", "Soon Jiaying", 
  "Andrew Lim", "Janice Leong", "Oliver Tan"
];

// Blocked days (in YYYY-MM-DD format)
const blockedDays = [
  "2025-1-1", "2025-1-29", "2025-1-30", 
  "2025-3-31", "2025-4-18", "2025-5-1", 
  "2025-5-12", "2025-6-7", "2025-8-9", 
  "2025-3-28", "2025-10-25", "2025-10-20", "2025-12-25"
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
        dayKey,
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
    <div
      ref={drag}
      style={{
        padding: '8px 12px',
        margin: '5px',
        backgroundColor: '#A8E6CF', // Pastel blue
        cursor: 'move',
        borderRadius: '20px', // Rounded corners for tag shape
        fontWeight: 'bold',
        color: '#333',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
      }}
    >
      {name}
    </div>
  );
};

// Calendar Day (Drop Zone)
const CalendarDay = ({ day, moveTherapist, removeTherapist, isToday, isBlocked }) => {
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6; // 0 = Sunday, 6 = Saturday
  const finalBlockedStatus = isBlocked || isWeekend; // Combine blocked days and weekends

  const [, drop] = useDrop(() => ({
    accept: 'THERAPIST',
    drop: (item) => {
      if (!finalBlockedStatus) {
        moveTherapist(item.name, day.dayKey); // Only move if the day is not blocked
      }
    }
  }));

  return (
    <div
      ref={drop}
      style={{
        padding: '10px',
        minHeight: '80px',
        position: 'relative',
        backgroundColor: isToday 
          ? '#FFEB3B' // Highlight today
          : finalBlockedStatus 
          ? '#B0BEC5' // Solid grey for blocked days
          : 'white', // Normal color for non-blocked days
        borderRadius: '0px', // Rounded corners
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden', // Prevent border overflow
      }}
    >
      <strong>{day.date.toDateString()}</strong>
      {day.therapists.length > 0 ? (
        day.therapists.map((therapist, idx) => (
          <div
            key={idx}
            style={{
              padding: '5px',
              backgroundColor: '#D1F2E8', // Pastel green
              borderRadius: '15px', // Rounded corners for therapist tag
              margin: '5px 0',
            }}
          >
            {therapist}
            <button
              onClick={() => removeTherapist(therapist, day.dayKey)}
              style={{
                marginLeft: '10px',
                color: 'red',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                fontWeight: 'bold',
              }}
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
            isBlocked={isBlocked}
          />
        );
      })}
    </div>
  );
};

const App = () => {
  const [currentMonth, setCurrentMonth] = useState(0); // Start with January (index 0)
  const [calendar, setCalendar] = useState(get2025Calendar()); // Initialize calendar state
  const [todayDate, setTodayDate] = useState(null); // For tracking today's date
  const [autoRosterTriggered, setAutoRosterTriggered] = useState(false); // Track if Auto Roster was triggered

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
    setCalendar((prevCalendar) => {
      const updatedCalendar = prevCalendar.map((month, index) => {
        if (index === currentMonth) {
          return month.map((day) => {
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
    setCalendar((prevCalendar) => {
      const updatedCalendar = prevCalendar.map((month, index) => {
        if (index === currentMonth) {
          return month.map((day) => {
            if (day.dayKey === dayKey) {
              return { ...day, therapists: day.therapists.filter((therapist) => therapist !== name) };
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
    setCalendar(get2025Calendar()); // Reset the calendar state to its initial state
    setAutoRosterTriggered(false); // Reset auto roster trigger
  };

  const saveAsPNG = () => {
    // First, ensure all greyed-out days are one solid color (e.g., #D3D3D3)
    const calendarDays = document.querySelectorAll('.calendar-day');
    calendarDays.forEach((day) => {
      const backgroundColor = day.style.backgroundColor;
      if (backgroundColor === 'rgb(211, 211, 211)') {  // This checks if the day is greyed out
        day.style.backgroundColor = '#B0C4DE';  // Set to a solid color (e.g., Light Steel Blue)
      }
    });

    // Now capture only the calendar container
    const calendarContainer = document.getElementById("calendar-container");

    html2canvas(calendarContainer, {
      ignoreElements: (el) => el.classList.contains("ignore-export"), // Ignore any elements that shouldn't appear in the screenshot
      backgroundColor: "white", // Ensure transparent background
      useCORS: true, // Allow cross-origin resource sharing for external images
      scrollX: 0, // Ensure the whole page is captured starting from the top-left corner
      scrollY: 0,
      x: 0,
      y: 0,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'calendar_screenshot.png'; // Set the default filename for download
      link.click(); // Trigger the download

      // Reset the greyed-out days back to their original color (optional)
      calendarDays.forEach((day) => {
        if (day.style.backgroundColor === '#B0C4DE') {
          day.style.backgroundColor = '#D3D3D3'; // Reset to original grey color
        }
      });
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App" style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
        <h1>Therapist Roster for 2025</h1>

        <div>
          <button onClick={goToToday}>Go to Today</button>
          <button onClick={resetCalendar}>Reset Calendar</button>
          <button onClick={saveAsPNG}>Save Calendar as PNG</button>
        </div>

        <div id="calendar-container" style={{ marginTop: '20px' }}>
          <h2>{calendar[0][0].date.toLocaleString('default', { month: 'long' })}</h2>
          <Calendar 
            monthDays={calendar[currentMonth]} 
            moveTherapist={moveTherapist}
            removeTherapist={removeTherapist}
            todayDate={todayDate}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>Available Therapists</h3>
          {therapists.map((therapist) => (
            <Therapist key={therapist} name={therapist} />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default App;



















































