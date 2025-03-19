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

// Define blocked days for 2025 in Singapore Timezone
const blockedDays = [
  '2025-01-01', // New Year's Day
  '2025-01-29', // Chinese New Year
  '2025-01-30',
  '2025-03-31', // Hari Raya Puasa
  '2025-04-18', // Good Friday
  '2025-05-01', // Labour Day
  '2025-05-12', // Vesak Day
  '2025-06-07', // Hari Raya Haji
  '2025-08-09', // National Day
  '2025-10-20', // Deepavali
  '2025-12-25', // Christmas Day
  '2025-10-21', // NUS Well-Being Day
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
      const dayKey = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
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
const CalendarDay = ({ day, moveTherapist, removeTherapist, isToday, monthIndex, isBlocked }) => {
  const [, drop] = useDrop(() => ({
    accept: 'THERAPIST',
    drop: (item) => {
      if (!isBlocked) {
        console.log(`Dropped therapist: ${item.name} on ${day.dayKey} in month ${monthIndex}`);
        moveTherapist(item.name, day.dayKey, monthIndex); // Use dayKey as the unique identifier
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
        backgroundColor: isBlocked ? '#d3d3d3' : isToday ? '#FFEB3B' : 'white', // Blocked days greyed out
      }}
    >
      <strong>{day.date.toDateString()}</strong>
      {day.therapists.length > 0 ? (
        day.therapists.map((therapist, idx) => (
          <div key={idx} style={{ padding: '5px', backgroundColor: 'lightgreen' }}>
            {therapist}
            <button 
              onClick={() => removeTherapist(therapist, day.dayKey, monthIndex)} 
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
const Calendar = ({ monthDays, moveTherapist, removeTherapist, todayDate, monthIndex }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginTop: '20px' }}>
      {monthDays.map((day, index) => {
        const isToday = todayDate && day.date.toDateString() === todayDate.toDateString();
        const isBlocked = blockedDays.includes(day.dayKey); // Check if the day is in blockedDays
        return (
          <CalendarDay 
            key={day.dayKey} // Use the unique dayKey
            day={day} 
            moveTherapist={moveTherapist} 
            removeTherapist={removeTherapist} 
            isToday={isToday} 
            monthIndex={monthIndex} 
            isBlocked={isBlocked} // Check if the day is blocked
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
  const calendarRef = useRef(); // Reference to the calendar container

  // Get the current date (Singapore time)
  const currentDate = new Date();
  const singaporeTime = new Date(currentDate.toLocaleString("en-US", { timeZone: "Asia/Singapore" }));

  const currentDay = singaporeTime.getDate();
  const currentMonthIndex = singaporeTime.getMonth();
  const currentYear = singaporeTime.getFullYear();

  // Set today's date when "Today" button is clicked
  const goToToday = () => {
    setCurrentMonth(currentMonthIndex); // Set to current month
    setTodayDate(singaporeTime); // Set today's date in Singapore timezone
  };

  // Handle moving a therapist into a calendar day
  const moveTherapist = (name, dayKey, monthIndex) => {
    console.log(`Moving therapist: ${name} to day ${dayKey} in month ${monthIndex}`);
    setCalendar(prevCalendar => {
      const updatedCalendar = prevCalendar.map((month, index) => {
        if (index === monthIndex) {
          return month.map(day => {
            if (day.dayKey === dayKey) {
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
  const removeTherapist = (name, dayKey, monthIndex) => {
    console.log(`Removing therapist: ${name} from day ${dayKey} in month ${monthIndex}`);
    setCalendar(prevCalendar => {
      const updatedCalendar = prevCalendar.map((month, index) => {
        if (index === monthIndex) {
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

  // Function to generate the auto-roster using Round Robin
  const generateAutoRoster = () => {
    let newCalendar = [...calendar]; // Clone the calendar state
    let therapistIndex = 0; // Start from the first therapist

    // Generate auto roster for each month
    newCalendar = newCalendar.map((month, monthIndex) => {
      return month.map(day => {
        const dayOfWeek = day.date.getDay(); // Get the day of the week (0-6)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          return day; // Skip weekends (Saturday: 6, Sunday: 0)
        }

        // If the day is empty and not blocked, assign a therapist in round-robin fashion
        if (day.therapists.length === 0 && !blockedDays.includes(day.dayKey)) {
          let selectedTherapist = therapists[therapistIndex];
          day.therapists.push(selectedTherapist);

          // Move to the next therapist in the list (round-robin)
          therapistIndex = (therapistIndex + 1) % therapists.length;
        }

        return day;
      });
    });

    setCalendar(newCalendar); // Update the calendar state
  };

  // Reset the calendar to its original unassigned state
  const resetCalendar = () => {
    const initialCalendar = get2025Calendar(); // Get the original empty calendar
    setCalendar(initialCalendar); // Reset the calendar state
  };

  // Function to save the calendar as PNG
  const saveAsPNG = () => {
    html2canvas(calendarRef.current).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'calendar.png'; // Set the name of the file
      link.click(); // Trigger the download
    });
  };

  useEffect(() => {
    console.log("Updated calendar state:", calendar);
  }, [calendar]);

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
            <button onClick={() => setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1))} style={{ marginRight: '10px', cursor: 'pointer' }}>←</button>
            <button onClick={() => setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1))} style={{ cursor: 'pointer' }}>→</button>
            <button onClick={goToToday} style={{ marginLeft: '20px', cursor: 'pointer' }}>Today</button>
            <button onClick={saveAsPNG} style={{ marginLeft: '20px', cursor: 'pointer' }}>Save as .PNG</button>
            <button onClick={generateAutoRoster} style={{ marginLeft: '20px', cursor: 'pointer' }}>Generate Auto-Roster</button>
            <button onClick={resetCalendar} style={{ marginLeft: '20px', cursor: 'pointer' }}>Reset Calendar</button>
          </div>
          <div ref={calendarRef}>
            <Calendar 
              monthDays={calendar[currentMonth]} 
              moveTherapist={moveTherapist} 
              removeTherapist={removeTherapist} 
              todayDate={todayDate} 
              monthIndex={currentMonth} 
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;









































