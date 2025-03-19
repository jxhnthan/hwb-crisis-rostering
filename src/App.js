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

// Blocked days (e.g., public holidays and special days)
const blockedDays = [
  { date: '2025-01-01', reason: 'New Year\'s Day' },
  { date: '2025-01-29', reason: 'Chinese New Year' },
  { date: '2025-01-30', reason: 'Chinese New Year' },
  { date: '2025-03-31', reason: 'Hari Raya Puasa' },
  { date: '2025-04-18', reason: 'Good Friday' },
  { date: '2025-05-01', reason: 'Labour Day' },
  { date: '2025-05-12', reason: 'Vesak Day' },
  { date: '2025-06-07', reason: 'Hari Raya Haji' },
  { date: '2025-08-09', reason: 'National Day' },
  { date: '2025-10-20', reason: 'Deepavali' },
  { date: '2025-10-21', reason: 'NUS Well-Being Day' }, // Blocked day
  { date: '2025-12-25', reason: 'Christmas Day' }
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

// Check if a day is blocked
const isBlockedDay = (dayKey) => {
  return blockedDays.some(blocked => blocked.date === dayKey);
};

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
const CalendarDay = ({ day, moveTherapist, removeTherapist, isToday, monthIndex }) => {
  const isBlocked = isBlockedDay(day.dayKey); // Check if this day is blocked
  const [, drop] = useDrop(() => ({
    accept: 'THERAPIST',
    drop: (item) => {
      if (!isBlocked) {
        console.log(`Dropped therapist: ${item.name} on ${day.dayKey} in month ${monthIndex}`);
        moveTherapist(item.name, day.dayKey, monthIndex); // Use dayKey as the unique identifier
      } else {
        console.log(`Cannot drop therapist on blocked day: ${day.dayKey}`);
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
        backgroundColor: isBlocked ? '#f0f0f0' : isToday ? '#FFEB3B' : 'white', // Grey out blocked days
        cursor: isBlocked ? 'not-allowed' : 'move', // Disable drop on blocked days
        opacity: isBlocked ? 0.5 : 1 // Reduce opacity for blocked days
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
      {isBlocked && <div style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '12px', color: 'red' }}>Blocked</div>}
    </div>
  );
};

// Calendar Grid Component
const Calendar = ({ monthDays, moveTherapist, removeTherapist, todayDate, monthIndex }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginTop: '20px' }}>
      {monthDays.map((day, index) => {
        const isToday = todayDate && day.date.toDateString() === todayDate.toDateString();
        return (
          <CalendarDay 
            key={day.dayKey} // Use the unique dayKey
            day={day} 
            moveTherapist={moveTherapist} 
            removeTherapist={removeTherapist} 
            isToday={isToday} 
            monthIndex={monthIndex} 
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
        if (dayOfWeek === 0 || dayOfWeek === 6 || isBlockedDay(day.dayKey)) {
          return day; // Skip weekends (Saturday: 6, Sunday: 0) and blocked days
        }

        // If the day is empty, assign a therapist in round-robin fashion
        if (day.therapists.length === 0) {
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

          <button onClick={goToToday} style={{ marginBottom: '20px' }}>Go to Today</button>

          <Calendar 
            monthDays={calendar[currentMonth]} 
            moveTherapist={moveTherapist} 
            removeTherapist={removeTherapist} 
            todayDate={todayDate} 
            monthIndex={currentMonth} 
          />

          <div style={{ marginTop: '20px' }}>
            <button onClick={generateAutoRoster}>Generate Auto-Roster</button>
            <button onClick={resetCalendar} style={{ marginLeft: '10px' }}>Reset Calendar</button>
            <button onClick={saveAsPNG} style={{ marginLeft: '10px' }}>Save as PNG</button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;






































