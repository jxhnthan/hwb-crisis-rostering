import React, { useState } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';

// Define therapist names
const therapists = [
  "Dominic Yeo", "Kirsty Png", "Soon Jiaying", 
  "Andrew Lim", "Janice Leong", "Oliver Tan",
  "Claudia Ahl", "Seanna Neo", "Xiao Hui"
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

const Therapist = ({ name }) => {
  const [, drag] = useDrag(() => ({
    type: 'THERAPIST',
    item: { name },
  }));

  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  return (
    <div
      ref={drag}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        margin: '6px 0',
        backgroundColor: '#E0F7FA',
        borderRadius: '999px',
        fontWeight: '500',
        color: '#00796B',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
        cursor: 'grab',
        transition: 'background 0.2s, transform 0.1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B2EBF2')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E0F7FA')}
    >
      <div
        style={{
          backgroundColor: '#00796B',
          color: 'white',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
        }}
      >
        {initials}
      </div>
      <span>{name}</span>
    </div>
  );
};

// Calendar Day (Drop Zone)
const CalendarDay = ({ day, moveTherapist, removeTherapist, isToday, isBlocked }) => {
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
  const finalBlockedStatus = isBlocked || isWeekend;

  const [{ isOver, canDrop }, drop] = useDrop(() => ({ // Add isOver and canDrop
    accept: 'THERAPIST',
    drop: (item) => {
      if (!finalBlockedStatus) {
        moveTherapist(item.name, day.dayKey);
      }
    },
    canDrop: () => !finalBlockedStatus, // Prevent dropping on blocked days
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const dayNumber = day.date.getDate();
  const isCurrentMonth = new Date().getMonth() === day.date.getMonth() && new Date().getFullYear() === day.date.getFullYear(); // Optional: for styling non-current month days if you ever show them

  let backgroundColor = '#FFFFFF'; // Default background
  let textColor = '#333333';    // Default text color
  let dayNumberColor = '#4A5568'; // Slightly muted day number

  if (finalBlockedStatus) {
    backgroundColor = '#F7FAFC'; // Very light grey for blocked/weekend
    textColor = '#A0AEC0';       // Muted text for blocked
    dayNumberColor = '#A0AEC0';
  }
  if (isToday) {
    backgroundColor = '#E6FFFA'; // Light teal for today
    dayNumberColor = '#2C7A7B';   // Stronger teal for today's number
  }

  // Style for when a therapist is being dragged over a droppable day
  if (isOver && canDrop) {
    backgroundColor = '#B2F5EA'; // Highlight when draggable is over
  }

  return (
    <div
      ref={drop}
      style={{
        padding: '8px',
        minHeight: '120px', // Increased min-height for more space
        position: 'relative',
        backgroundColor: backgroundColor,
        borderRadius: '6px', // Softer corners
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)', // Softer shadow
        display: 'flex',
        flexDirection: 'column',
        gap: '6px', // Space between items inside the day cell
        border: `1px solid ${isToday ? '#4FD1C5' : '#E2E8F0'}`, // Subtle border, emphasized for today
        transition: 'background-color 0.2s ease-in-out',
      }}
    >
      <strong
        style={{
          alignSelf: 'flex-end', // Position day number to top-right
          fontSize: '0.85rem',
          color: dayNumberColor,
          backgroundColor: isToday ? '#B2F5EA' : 'transparent', // Optional: small bg circle for today's number
          borderRadius: isToday ? '50%' : '0',
          padding: isToday ? '2px 6px' : '0',
          lineHeight: '1',
        }}
      >
        {dayNumber}
      </strong>

      {day.therapists.length > 0 ? (
        day.therapists.map((therapist, idx) => (
          <div
            key={idx}
            style={{
              fontSize: '0.8rem',
              padding: '4px 8px',
              backgroundColor: '#E6FFFA', // Consistent light teal for assigned
              color: '#234E52',        // Darker teal text
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{therapist}</span>
            <button
              onClick={() => removeTherapist(therapist, day.dayKey)}
              style={{
                marginLeft: '8px',
                color: '#E53E3E', // Red for remove
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                fontWeight: 'bold',
                padding: '2px',
                lineHeight: '1',
              }}
              title={`Remove ${therapist}`} // Accessibility
            >
              × {/* Use an 'x' icon (times symbol) */}
            </button>
          </div>
        ))
      ) : (
        !finalBlockedStatus && ( // Only show placeholder if not blocked
          <div style={{
            fontSize: '0.75rem',
            color: '#A0AEC0',
            textAlign: 'center',
            marginTop: 'auto', // Push to bottom if cell expands
            marginBottom: 'auto'
          }}>
            Empty
          </div>
        )
      )}
      {finalBlockedStatus && !isToday && ( // Label for blocked/weekend if not today
         <div style={{
            fontSize: '0.7rem',
            color: '#718096',
            textAlign: 'center',
            marginTop: 'auto',
            marginBottom: 'auto'
          }}>
            {isWeekend && !blockedDays.includes(day.dayKey) ? 'Weekend' : 'Blocked'}
         </div>
      )}
    </div>
  );
};

// Calendar Grid Component
const Calendar = ({ monthDays, moveTherapist, removeTherapist, todayDate }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get the first day of the month to determine padding needed for the grid
  const firstDayOfMonth = monthDays.length > 0 ? monthDays[0].date.getDay() : 0;

  return (
    <>
      {/* Day of Week Headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px', // Slightly reduced gap to match cell padding
        marginTop: '20px',
        marginBottom: '8px', // Space before actual calendar days
        fontWeight: '600',
        color: '#4A5568',
        textAlign: 'center',
      }}>
        {daysOfWeek.map(dayName => <div key={dayName}>{dayName}</div>)}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px', // Consistent gap
      }}>
        {/* Add empty divs for padding if the month doesn't start on Sunday */}
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} style={{
            backgroundColor: '#F7FAFC', // Match blocked background or even lighter
            borderRadius: '6px',
            minHeight: '120px', // Match CalendarDay minHeight
          }} />
        ))}
        {monthDays.map((day) => {
          const isToday = todayDate && day.date.toDateString() === todayDate.toDateString();
          const isBlocked = blockedDays.includes(day.dayKey);
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
    </>
  );
};

const App = () => {
  const [currentMonth, setCurrentMonth] = useState(0); // Start with January (index 0)
  const [calendar, setCalendar] = useState(get2025Calendar()); // Initialize calendar state
  const [todayDate, setTodayDate] = useState(null); // For tracking today's date
  const [autoRosterTriggered, setAutoRosterTriggered] = useState(false); // Track if Auto Roster was triggered
  const [workingFromHome, setWorkingFromHome] = useState(
    therapists.reduce((acc, therapist) => {
      acc[therapist] = {
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
      };
      return acc;
    }, {})
  );

  // Count assigned days per therapist for the current month
const assignmentCounts = therapists.reduce((acc, therapist) => {
  acc[therapist] = calendar[currentMonth].filter((day) =>
    day.therapists.includes(therapist)
  ).length;
  return acc;
}, {});

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
    const calendarContainer = document.getElementById("calendar-container");

    html2canvas(calendarContainer, {
      backgroundColor: "white", // Ensure a white background for the calendar
      useCORS: true,           // Allow cross-origin images to be included
      scale: 2                 // Higher resolution for better image quality
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const currentMonthName = calendar[currentMonth][0].date.toLocaleString("default", { month: "long" });
      link.href = imgData;
      link.download = `Therapist_Roster_${currentMonthName}_2025.png`;
      link.click(); // Trigger the download
    }).catch((error) => {
      console.error("Error generating PNG:", error);
    });
  };

  // Auto-roster therapists when the button is clicked
  const autoRoster = () => {
    setCalendar((prevCalendar) => {
      const updatedCalendar = [...prevCalendar];

      // Shuffle therapists for better distribution
      const shuffledTherapists = [...therapists].sort(() => Math.random() - 0.5);
      let therapistIndex = 0;

      updatedCalendar[currentMonth] = updatedCalendar[currentMonth].map((day) => {
        const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
        const dayOfWeek = day.date.toLocaleString('default', { weekday: 'long' });

        // Check if the therapist is working from home on this day
        if (
          day.therapists.length === 0 &&
          !blockedDays.includes(day.dayKey) &&
          !isWeekend
        ) {
          // Get the current therapist
          let currentTherapist = shuffledTherapists[therapistIndex];

          // Check if this therapist is working from home on this day
          while (workingFromHome[currentTherapist][dayOfWeek]) {
            therapistIndex = (therapistIndex + 1) % shuffledTherapists.length;
            currentTherapist = shuffledTherapists[therapistIndex];
          }

          // Assign therapist to the day
          day.therapists.push(currentTherapist);
          therapistIndex = (therapistIndex + 1) % shuffledTherapists.length;
        }
        return day;
      });

      return updatedCalendar;
    });

    setAutoRosterTriggered(true);
  };

  const buttonStyle = {
    padding: '8px 16px',
    background: '#f4f4f7',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background 0.2s',
    marginRight: '10px', // Ensure buttons are spaced out a bit
  };

  const changeMonth = (direction) => {
    setCurrentMonth((prevMonth) => {
      if (direction === 'next') {
        return (prevMonth + 1) % 12; // Go to next month
      } else if (direction === 'prev') {
        return (prevMonth - 1 + 12) % 12; // Go to previous month
      }
      return prevMonth;
    });
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px', paddingBottom: '80px'}}>
        <div>
          <h2>Therapists</h2>
          {therapists.map((name, index) => (
            <Therapist key={index} name={name} />
          ))}
          
          <div style={{ marginTop: '20px' }}>

  <h3>Set Working from Home Days</h3>
  <table style={{ borderCollapse: 'collapse', width: '100%' }}>
    <thead>
      <tr>
        <th style={{ border: '1px solid #ccc', padding: '8px' }}>Therapist</th>
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
          <th key={day} style={{ border: '1px solid #ccc', padding: '8px' }}>{day}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {therapists.map((therapist) => (
        <tr key={therapist}>
          <td style={{ border: '1px solid #ccc', padding: '8px' }}>{therapist}</td>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
            <td key={day} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={workingFromHome[therapist][day]}
                onChange={() =>
                  setWorkingFromHome((prev) => ({
                    ...prev,
                    [therapist]: {
                      ...prev[therapist],
                      [day]: !prev[therapist][day],
                    },
                  }))
                }
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>

<div style={{ marginTop: '30px' }}>
  <h3>Therapist Assignment Tracker</h3>
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginTop: '10px'
  }}>
    {Object.entries(assignmentCounts).map(([therapist, count]) => (
      <div
        key={therapist}
        style={{
          padding: '10px',
          backgroundColor: '#E3F2FD',
          borderRadius: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
        }}
      >
        <strong>{therapist}</strong><br />
        <span>Assigned Days: {count}</span>
      </div>
    ))}
  </div>
</div>
        </div>

        {/* Calendar */}
        <div id="calendar-container" style={{ width: '50%' }}>
          <h2>Calendar for {calendar[currentMonth][0].date.toLocaleString("default", { month: "long" })}</h2>

          {/* Month navigation buttons */}
          <button
            style={buttonStyle}
            onClick={() => changeMonth('prev')}
          >
            Previous
          </button>
          <button
            style={buttonStyle}
            onClick={() => changeMonth('next')}
          >
            Next
          </button>

          <Calendar 
            monthDays={calendar[currentMonth]} 
            moveTherapist={moveTherapist} 
            removeTherapist={removeTherapist} 
            todayDate={todayDate}
          />
          <div style={{ marginTop: '20px' }}>
            <button 
              style={buttonStyle} 
              onClick={goToToday}
            >
              Today
            </button>
            <button 
              style={buttonStyle} 
              onClick={autoRoster}
            >
              Auto Roster
            </button>
            <button 
              style={buttonStyle} 
              onClick={resetCalendar}
            >
              Reset Calendar
            </button>
            <button 
              style={buttonStyle} 
              onClick={saveAsPNG}
            >
              Save as PNG
            </button>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;




















































