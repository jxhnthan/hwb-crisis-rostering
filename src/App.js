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
  const [currentMonth, setCurrentMonth] = useState(0);
  const [calendar, setCalendar] = useState(get2025Calendar());
  const [todayDate, setTodayDate] = useState(null);
  const [autoRosterTriggered, setAutoRosterTriggered] = useState(false);
  const [workingFromHome, setWorkingFromHome] = useState(
    therapists.reduce((acc, therapist) => {
      acc[therapist] = {
        Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: false,
      };
      return acc;
    }, {})
  );

  const assignmentCounts = therapists.reduce((acc, therapist) => {
    acc[therapist] = calendar[currentMonth].filter((day) =>
      day.therapists.includes(therapist)
    ).length;
    return acc;
  }, {});

  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const goToToday = () => {
    setCurrentMonth(currentMonthIndex);
    setTodayDate(new Date(currentYear, currentMonthIndex, currentDay));
  };

  const moveTherapist = (name, dayKey) => {
    setCalendar((prevCalendar) => {
      const updatedCalendar = prevCalendar.map((month, index) => {
        if (index === currentMonth) {
          return month.map((day) => {
            if (day.dayKey === dayKey && !blockedDays.includes(dayKey) && !day.therapists.includes(name)) {
                // Check if the day is a weekend
                const dateObj = new Date(day.dayKey.split('-')[0], day.dayKey.split('-')[1]-1, day.dayKey.split('-')[2]);
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                if (!isWeekend) { // Only add if not a weekend
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
  

  const removeTherapist = (name, dayKey) => {
    setCalendar((prevCalendar) => {
      const updatedCalendar = prevCalendar.map((month, index) => {
        if (index === currentMonth) {
          return month.map((day) => {
            if (day.dayKey === dayKey) {
              return { ...day, therapists: day.therapists.filter((t) => t !== name) };
            }
            return day;
          });
        }
        return month;
      });
      return updatedCalendar;
    });
  };

  const resetCalendar = () => {
    setCalendar(get2025Calendar());
    setAutoRosterTriggered(false);
  };

  const saveAsPNG = () => {
    const calendarContainer = document.getElementById("calendar-container-content"); // Target the inner content for better PNG
    if (!calendarContainer) {
        console.error("Calendar container content not found for PNG export.");
        return;
    }
    html2canvas(calendarContainer, {
      backgroundColor: "#FFFFFF", // Calendar content itself is white
      useCORS: true,
      scale: 2
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const currentMonthName = calendar[currentMonth][0].date.toLocaleString("default", { month: "long" });
      link.href = imgData;
      link.download = `Therapist_Roster_${currentMonthName}_2025.png`;
      link.click();
    }).catch((error) => {
      console.error("Error generating PNG:", error);
    });
  };

const autoRoster = () => {
  setCalendar((prevCalendar) => {
    const updatedCalendar = [...prevCalendar]; // Shallow copy of months array
    const currentMonthData = [...updatedCalendar[currentMonth]]; // Shallow copy of current month's days

    // 1. Initialize assignment counts for this rostering cycle (for the current month)
    const monthlyAssignmentCounts = therapists.reduce((acc, therapist) => {
      acc[therapist] = 0;
      return acc;
    }, {});

    // Create a list of therapists that can be sorted by assignment count
    let availableTherapists = [...therapists];

    // 2. Iterate through each day of the current month
    const newMonthDays = currentMonthData.map((day) => {
      // Create a new day object to avoid mutating the original day from prevCalendar directly in the map
      const newDay = { ...day, therapists: [...day.therapists] };

      const isWeekend = newDay.date.getDay() === 0 || newDay.date.getDay() === 6;
      const dayOfWeek = newDay.date.toLocaleString('default', { weekday: 'long' });

      if (
        newDay.therapists.length === 0 && // Only assign if no one is already there
        !blockedDays.includes(newDay.dayKey) &&
        !isWeekend
      ) {
        // 3. Sort available therapists:
        //    - Primary: Ascending by their current monthlyAssignmentCounts.
        //    - Secondary (tie-breaker): You could use a fixed order, a shuffle then sort,
        //      or track who was "last picked" from the equally-counted group.
        //      For simplicity here, we'll just sort by name as a consistent tie-breaker after shuffling the initial list once.
        //      A more robust tie-breaker might involve a "last assigned timestamp" or round-robin index.

        availableTherapists.sort((a, b) => {
          // Primary sort: by number of assignments this month
          const countDiff = monthlyAssignmentCounts[a] - monthlyAssignmentCounts[b];
          if (countDiff !== 0) {
            return countDiff;
          }
          // Secondary sort (tie-breaker): could be alphabetical or a pre-shuffled order
          return a.localeCompare(b); // Simple alphabetical tie-breaker
        });

        let assignedThisDay = false;
        for (const therapist of availableTherapists) {
          if (!workingFromHome[therapist] || !workingFromHome[therapist][dayOfWeek]) {
            newDay.therapists = [therapist]; // Assign the therapist
            monthlyAssignmentCounts[therapist]++; // Increment their count for this month
            assignedThisDay = true;

            // Optional: To ensure the *next* day doesn't pick the same therapist again if counts are still tied,
            // you could "move this therapist to the back of the queue" for the next iteration
            // by re-sorting or by managing a separate queue.
            // For now, the primary sort by count will naturally try to pick others next.
            break; // Move to the next day
          }
        }
        if (!assignedThisDay) {
          // console.warn(`Could not assign therapist to ${newDay.dayKey} - all available are WFH or other constraints.`);
        }
      }
      return newDay; // Return the modified or original day
    });

    updatedCalendar[currentMonth] = newMonthDays; // Put the updated days back into the calendar
    return updatedCalendar;
  });

  setAutoRosterTriggered(true);
};

  const buttonStyle = {
    padding: '10px 18px',
    background: '#FFFFFF',
    color: '#4A5568',
    border: '1px solid #CBD5E0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s, box-shadow 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
    // Add hover effects via CSS if possible, or use onMouseEnter/Leave for JS-in-CSS
  };

  const changeMonth = (direction) => {
    setCurrentMonth((prevMonth) => {
      let newMonth = prevMonth;
      if (direction === 'next') {
        newMonth = (prevMonth + 1) % 12;
      } else if (direction === 'prev') {
        newMonth = (prevMonth - 1 + 12) % 12;
      }
      setTodayDate(null); // Clear "today" highlight when changing months
      return newMonth;
    });
  };

  // Style for the WFH table and Assignment Tracker cards for consistency
  const cardStyle = {
    backgroundColor: '#FFFFFF',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    marginBottom: '20px', // Added for spacing between sidebar cards
  };
  const tableCellStyle = { border: '1px solid #E2E8F0', padding: '8px', textAlign: 'center' };
  const tableHeaderStyle = { ...tableCellStyle, backgroundColor: '#F7FAFC', fontWeight: '600', color: '#4A5568' };


  return (
    <DndProvider backend={HTML5Backend}>
      {/* 1. Overall Page Styling */}
      <div style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
        padding: '20px',
        backgroundColor: '#F9FAFB', // Light page background
        minHeight: '100vh',
      }}>
        {/* 2. Main Content Wrapper (Flex Container) */}
        <div style={{
          display: 'flex',
          gap: '30px', // Space between sidebar and calendar
          maxWidth: '1800px', // Max width for large screens
          margin: '0 auto',   // Center content
        }}>

          {/* 3. Sidebar Area */}
          <div style={{
            flex: '0 0 400px', // Fixed width for the sidebar
            display: 'flex',
            flexDirection: 'column',
            gap: '20px' // Space between sections in the sidebar
          }}>
            <div style={cardStyle}> {/* Therapists List in a Card */}
              <h2 style={{ marginTop: 0, marginBottom: '15px', color: '#1A202C', fontSize: '1.25rem' }}>Therapists</h2>
              {therapists.map((name, index) => (
                <Therapist key={index} name={name} />
              ))}
            </div>

            <div style={cardStyle}> {/* WFH Settings in a Card */}
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2D3748', fontSize: '1.1rem' }}>Set Working from Home Days</h3>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Therapist</th>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => ( // Shortened day names
                      <th key={day} style={tableHeaderStyle}>{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {therapists.map((therapist) => (
                    <tr key={therapist}>
                      <td style={{...tableCellStyle, textAlign: 'left', fontWeight: '500' }}>{therapist}</td>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                        <td key={day} style={tableCellStyle}>
                          <input
                            type="checkbox"
                            style={{ cursor: 'pointer' }}
                            checked={workingFromHome[therapist]?.[day] || false} // Safely access nested property
                            onChange={() =>
                              setWorkingFromHome((prev) => ({
                                ...prev,
                                [therapist]: {
                                  ...prev[therapist],
                                  [day]: !prev[therapist]?.[day], // Safely toggle
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

            <div style={cardStyle}> {/* Assignment Tracker in a Card */}
              <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#2D3748', fontSize: '1.1rem' }}>Therapist Assignment Tracker</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', // Responsive columns
                gap: '12px',
              }}>
                {Object.entries(assignmentCounts).map(([therapist, count]) => (
                  <div
                    key={therapist}
                    style={{
                      padding: '12px',
                      backgroundColor: '#E6FFFA', // Light teal, matching calendar items
                      color: '#234E52',
                      borderRadius: '6px',
                      // boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // Optional: if you want individual shadows
                      fontSize: '0.9rem'
                    }}
                  >
                    <strong style={{ display: 'block', marginBottom: '4px' }}>{therapist}</strong>
                    <span>Assigned: {count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Calendar Area (Main Content) */}
          {/* Outer div for the calendar "card" styling */}
          <div style={{
            flex: '1', // Takes remaining space
            backgroundColor: '#FFFFFF',
            padding: '25px',
            borderRadius: '12px', // Larger radius for the main card
            boxShadow: '0 6px 18px rgba(0,0,0,0.07)', // More prominent shadow for the main card
          }}>
            {/* This inner div will be targeted by html2canvas */}
            <div id="calendar-container-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: '#1A202C', margin: 0, fontSize: '1.5rem' }}>
                    {calendar[currentMonth][0].date.toLocaleString("default", { month: "long" })} 2025
                </h2>
                <div>
                    <button
                    type="button" // Good practice
                    style={{ ...buttonStyle, marginRight: '10px' }}
                    onClick={() => changeMonth('prev')}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8';}}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF';}}
                    >
                    ← Previous
                    </button>
                    <button
                    type="button" // Good practice
                    style={buttonStyle}
                    onClick={() => changeMonth('next')}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8';}}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF';}}
                    >
                    Next →
                    </button>
                </div>
                </div>

                <Calendar
                monthDays={calendar[currentMonth]}
                moveTherapist={moveTherapist}
                removeTherapist={removeTherapist}
                todayDate={todayDate}
                />
            </div> {/* End of calendar-container-content */}

            <div style={{ marginTop: '30px', display: 'flex', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
              <button type="button" style={buttonStyle} onClick={goToToday}  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8';}} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF';}}>Today</button>
              <button
                type="button"
                style={{ ...buttonStyle, backgroundColor: '#38A169', color: 'white', border: '1px solid #38A169' }}
                onClick={autoRoster}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#2F855A';}}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#38A169';}}
              >
                Auto Roster
              </button>
              <button type="button" style={buttonStyle} onClick={resetCalendar} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8';}} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF';}}>Reset Calendar</button>
              <button type="button" style={buttonStyle} onClick={saveAsPNG} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F0F4F8';}} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF';}}>Save as PNG</button>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default App;




















































