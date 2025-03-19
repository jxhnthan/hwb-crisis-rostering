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
const CalendarDay = ({ day, moveTherapist, removeTherapist, isToday, isBlocked, monthIndex }) => {
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
        backgroundColor: isBlocked ? 'lightgrey' : isToday ? '#FFEB3B' : 'white', // Grey out blocked days
        cursor: isBlocked ? 'not-allowed' : 'pointer' // Disable interaction for blocked days
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
        const isBlocked = blockedDays.includes(day.dayKey); // Check if the day is blocked
        return (
          <CalendarDay 
            key={day.dayKey} // Use the unique dayKey
            day={day} 
            moveTherapist={moveTherapist} 
            removeTherapist={removeTherapist} 
            isToday={isToday} 
            isBlocked={isBlocked} // Pass blocked status
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

  // Function to generate the auto roster using Round Robin
  const generateAutoRoster = () => {
    let newCalendar = [...calendar]; // Clone the calendar state
    let therapistIndex = 0; // Start from the first therapist

    // Generate auto roster for each month
    newCalendar = newCalendar.map((month, monthIndex) => {
      return month.map(day => {
        const dayOfWeek = day.date.getDay(); // Get the day of the week (0-6)
        if (dayOfWeek === 0 || dayOfWeek === 6 || blockedDays.includes(day.dayKey)) {
          return day; // Skip weekends and blocked days
        }

        // If the day is empty, assign a therapist in round-robin fashion
        if (day.therapists.length === 0) {
          let selectedTherapist = therapists[therapistIndex];
          day.therapists.push(selectedTherapist); // Assign therapist
          therapistIndex = (therapistIndex + 1) % therapists.length; // Move to the next therapist in the list
        }
        return day;
      });
    });
    setCalendar(newCalendar); // Update the state with the new calendar
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

        <div style={{ overflowX: 'auto', width: '70%' }} ref={calendarRef}>
          <button onClick={goToToday} style={{ marginBottom: '20px' }}>Go to Today</button>
          <button onClick={generateAutoRoster} style={{ marginBottom: '20px' }}>Generate Auto-Roster</button>
          <button onClick={saveAsPNG} style={{ marginBottom: '20px' }}>Save Calendar as PNG</button>
          <h2>{calendar[currentMonth][0].date.toLocaleString('default', { month: 'long' })} 2025</h2>
          <Calendar 
            monthDays={calendar[currentMonth]} 
            moveTherapist={moveTherapist} 
            removeTherapist={removeTherapist} 
            todayDate={todayDate} 
            monthIndex={currentMonth}
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default App;











































