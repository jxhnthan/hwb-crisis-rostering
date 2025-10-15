import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import html2canvas from 'html2canvas';
import LZString from 'lz-string';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- Utility Data ---
const therapistGroups = [
  {
    role: "WBSP",
    therapists: [
      "Jiaying", "Kirsty", "Andrew",
      "Janice", "Oliver", "Claudia",
      "Seanna", "Xiao Hui"
    ]
  },
  {
    role: "Care Manager",
    therapists: [
      "Dominic"
    ]
  }
];

const therapists = therapistGroups.flatMap(group => group.therapists);

const therapistColors = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#A833FF',
  '#33FFF2', '#FFC733', '#33A8FF', '#FF8C33', '#8C33FF'
];

const getTherapistColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % therapistColors.length);
  return therapistColors[index];
};

const blockedDays2025 = [
  "2025-01-01", "2025-01-29", "2025-01-30",
  "2025-03-31", "2025-04-18", "2025-05-01",
  "2025-05-12", "2025-06-07", "2025-08-09",
  "2025-03-28", "2025-10-25", "2025-10-20",
  "2025-10-21", "2025-12-25"
];

const blockedDays2026 = [
  "2026-01-01", "2026-02-17", "2026-02-18",
  "2026-03-21", "2026-04-03", "2026-05-01",
  "2026-05-27", "2026-05-31", "2026-06-01",
  "2026-08-09", "2026-08-10", "2026-11-08",
  "2026-11-09", "2026-12-25"
];

const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

const getCalendarForYear = (year) => {
  const calendar = [];
  for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
    const daysInMonth = getDaysInMonth(year, monthIndex);
    const monthDays = Array.from({ length: daysInMonth }, (_, dayIndex) => {
      const date = new Date(year, monthIndex, dayIndex + 1);
      const formattedMonth = String(monthIndex + 1).padStart(2, '0');
      const formattedDay = String(dayIndex + 1).padStart(2, '0');
      const dayKey = `${year}-${formattedMonth}-${formattedDay}`;
      return { date, dayKey, therapists: [] };
    });
    calendar.push(monthDays);
  }
  return calendar;
};

const patchNotes = [
  {
    version: "1.2",
    date: "July 10, 2025",
    changes: [
      "Enhanced Therapist Section Design: Overhauled the left sidebar for a cleaner, more minimalistic aesthetic.",
      "Collapsible Therapist Roles: Therapists are now grouped by job role (WBSP, Case Manager) into collapsible sections, improving organisation and navigation.",
      "Sleeker Collapsible Indicators: Replaced previous arrow indicators with clear '+' and '-' symbols for a more modern and intuitive expand/collapse experience.",
      "Improved Therapist Tracker Visuals: The 'Therapist Assignment Tracker' now features visual color-coded indicators, displays the monthly average workload, and includes WFH day summaries for better insights.",
      "Refined Card Alignment and Spacing: General spacing and alignment across therapist cards and sections have been fine-tuned for a polished look."
    ]
  },
  {
    version: "1.1",
    date: "July 8, 2025",
    changes: [
      "Added 'Share Link' functionality to save and load calendar state via URL.",
      "Implemented LZString compression for significantly shorter shareable URLs.",
      "Included timestamp in shared data for unique link generation.",
      "Introduced a 'Patch Notes' tab to view application updates.",
      "Added shrinking feature for weekends when saving roster as PNG image."
    ]
  },
  {
    version: "1.0",
    date: "Feb 1, 2025",
    changes: [
      "Initial release of SWEE Therapist Roster application.",
      "Drag-and-drop therapist assignment to calendar days.",
      "Support for 2025 and 2026 calendar years with pre-defined blocked holidays.",
      "Automatic detection and styling for weekends and blocked holidays.",
      "Configurable Working From Home (WFH) settings for each therapist.",
      "Intelligent 'Auto Roster' feature for balanced therapist assignments.",
      "Real-time therapist assignment tracker.",
      "Ability to save the current calendar view as a PNG image."
    ]
  }
];

// --- Styles ---
const sectionHeadingStyle = {
  marginTop: 0,
  marginBottom: '20px',
  color: '#1a1a1a',
  fontSize: '1.1rem',
  fontWeight: '500',
  paddingBottom: '12px',
  borderBottom: '1px solid #f0f0f0',
  letterSpacing: '-0.01em'
};

const cardStyle = {
  backgroundColor: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  marginBottom: '24px',
  border: '1px solid #f5f5f5'
};

const tabButtonStyle = {
  padding: '12px 24px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '1rem',
  fontWeight: '500',
  transition: 'all 0.15s ease',
  flexGrow: 1,
  textAlign: 'center',
  outline: 'none',
  borderRadius: '8px 8px 0 0',
};

const buttonStyle = {
  padding: '8px 16px',
  background: '#ffffff',
  color: '#525252',
  border: '1px solid #e5e5e5',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '0.875rem',
  transition: 'all 0.15s ease',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  outline: 'none'
};

const tableCellStyle = { border: '1px solid #f0f0f0', padding: '12px 8px', textAlign: 'center', fontSize: '0.875rem' };
const tableHeaderStyle = { ...tableCellStyle, backgroundColor: '#fafafa', fontWeight: '500', color: '#525252' };

// --- Helper Functions for Data Compression/Decompression ---
const compressData = (data) => {
  const serializedCalendar = {};
  for (const year in data.calendarData) {
    serializedCalendar[year] = data.calendarData[year].map(month =>
      month.map(day => ({
        dayKey: day.dayKey,
        therapists: day.therapists
      }))
    );
  }
  const payload = JSON.stringify({
    timestamp: Date.now(),
    calendar: serializedCalendar,
    wfh: data.workingFromHome
  });
  return LZString.compressToEncodedURIComponent(payload);
};

const decompressData = (compressedString) => {
  try {
    const decompressedPayload = LZString.decompressFromEncodedURIComponent(compressedString);
    if (!decompressedPayload) {
      console.error("Decompression resulted in null. Data might be corrupted or empty.");
      return null;
    }
    const parsed = JSON.parse(decompressedPayload);

    const deserializedCalendar = {};
    for (const year in parsed.calendar) {
      deserializedCalendar[year] = parsed.calendar[year].map(month =>
        month.map(day => {
          const [yearStr, monthStr, dayStr] = day.dayKey.split('-');
          const dateObj = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));
          return {
            date: dateObj,
            dayKey: day.dayKey,
            therapists: day.therapists || []
          };
        })
      );
    }
    return {
      calendarData: deserializedCalendar,
      workingFromHome: parsed.wfh || {},
      timestamp: parsed.timestamp
    };
  } catch (e) {
    console.error("Failed to decompress data:", e);
    return null;
  }
};

// --- Components ---

const Therapist = React.memo(({ name }) => {
  const [, drag] = useDrag(() => ({
    type: 'THERAPIST',
    item: { name },
  }));

  const initials = name.split(' ').map((word) => word[0]).join('').toUpperCase();
  const color = getTherapistColor(name);

  return (
    <div
      ref={drag}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        gap: '8px', padding: '6px 8px', margin: '0', width: '100%',
        boxSizing: 'border-box', backgroundColor: '#f8fafc',
        borderRadius: '8px', fontWeight: '500', color: '#525252',
        border: '1px solid #f0f0f0', cursor: 'grab',
        transition: 'all 0.15s ease', fontSize: '0.8rem'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.borderColor = '#e0e0e0';
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#f8fafc';
        e.currentTarget.style.borderColor = '#f0f0f0';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          backgroundColor: color, color: 'white', borderRadius: '6px',
          width: '24px', height: '24px', display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', flexShrink: 0,
          fontWeight: '600'
        }}
      >
        {initials}
      </div>
      <span style={{ flex: 1, fontSize: '0.8rem' }}>{name}</span>
    </div>
  );
});

const CalendarDay = ({ day, moveTherapist, removeTherapist, isToday, isBlocked }) => {
  const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
  const finalBlockedStatus = isBlocked || isWeekend;

  // Debug log to see if component is re-rendering with updated data
  console.log(`CalendarDay ${day.dayKey} - therapists:`, day.therapists);

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'THERAPIST',
    drop: (item) => {
      if (!finalBlockedStatus) {
        moveTherapist(item.name, day.dayKey);
      }
    },
    canDrop: () => !finalBlockedStatus,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const dayNumber = day.date.getDate();

  let backgroundColor = '#ffffff';
  let dayNumberColor = '#525252';
  let borderColor = '#f0f0f0';
  let boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';

  if (finalBlockedStatus) {
    backgroundColor = '#fafafa';
    dayNumberColor = '#a0a0a0';
  }
  if (isToday) {
    backgroundColor = '#f0f9ff';
    dayNumberColor = '#0369a1';
    borderColor = '#7dd3fc';
  }

  if (isOver && canDrop) {
    backgroundColor = '#f0f9ff';
    borderColor = '#0ea5e9';
    boxShadow = '0 0 0 2px rgba(14, 165, 233, 0.3)';
  }

  return (
    <div
      ref={drop}
      className={`CalendarDay_root ${isWeekend ? 'weekend-day' : ''}`}
      style={{
        padding: '16px', minHeight: '160px', maxHeight: '200px', position: 'relative',
        backgroundColor: backgroundColor, borderRadius: '12px',
        boxShadow: boxShadow, display: 'flex', flexDirection: 'column',
        gap: '12px', border: `1px solid ${borderColor}`,
        transition: 'all 0.15s ease',
        overflowY: 'auto', overflowX: 'hidden',
        scrollbarWidth: 'thin', scrollbarColor: '#d0d0d0 #f5f5f5'
      }}
    >
      <strong
        style={{
          alignSelf: 'flex-end', fontSize: '0.875rem', color: dayNumberColor,
          backgroundColor: isToday ? '#dbeafe' : 'transparent',
          borderRadius: isToday ? '8px' : '0', padding: isToday ? '4px 8px' : '0',
          lineHeight: '1', fontWeight: '500'
        }}
      >
        {dayNumber}
      </strong>

      {day.therapists.length > 0 ? (
        day.therapists.map((therapist, idx) => {
          const initials = therapist.split(' ').map((word) => word[0]).join('').toUpperCase();
          const therapistBlockColor = getTherapistColor(therapist);

          return (
            <div
              key={idx}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', backgroundColor: '#f8fafc', color: '#334155',
                borderRadius: '10px', justifyContent: 'space-between',
                fontWeight: '500', boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                border: '1px solid #f1f5f9', position: 'relative',
                cursor: 'default', // Disable drag cursor
                userSelect: 'none' // Prevent text selection
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onDragStart={(e) => e.preventDefault()} // Prevent drag start
              draggable={false} // Explicitly disable dragging
            >
              <div
                style={{
                  backgroundColor: therapistBlockColor, color: 'white',
                  borderRadius: '8px', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.875rem', flexShrink: 0, fontWeight: '600'
                }}
              >
                {initials}
              </div>
              <span style={{ fontSize: '0.875rem', flexGrow: 1 }}>{therapist}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  console.log('Button clicked for removal'); // Debug log
                  
                  // Use setTimeout to ensure the click event is fully processed
                  setTimeout(() => {
                    removeTherapist(therapist, day.dayKey);
                  }, 0);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                }}
                style={{
                  marginLeft: '8px', color: '#ef4444', cursor: 'pointer',
                  background: 'transparent', border: 'none', fontWeight: '500',
                  padding: '6px', lineHeight: '1', fontSize: '1.1rem', transition: 'all 0.15s',
                  borderRadius: '6px', width: '28px', height: '28px', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', minWidth: '28px', minHeight: '28px',
                  pointerEvents: 'auto', // Ensure button is clickable
                  zIndex: 10 // Ensure button is above other elements
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#dc2626';
                  e.currentTarget.style.backgroundColor = '#fef2f2';
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={`Remove ${therapist}`}
                type="button"
              >
                ×
              </button>
            </div>
          );
        })
      ) : (
        !finalBlockedStatus && (
          <div style={{
            fontSize: '0.8rem', color: '#a0a0a0', textAlign: 'center',
            marginTop: 'auto', marginBottom: 'auto', fontStyle: 'italic'
          }}>
            Empty
          </div>
        )
      )}
      {finalBlockedStatus && !isToday && (
        <div style={{
          fontSize: '0.8rem', color: '#a0a0a0', textAlign: 'center',
          marginTop: 'auto', marginBottom: 'auto', fontStyle: 'italic'
        }}>
          {isWeekend && !isBlocked ? 'Weekend' : 'Blocked'}
        </div>
      )}
    </div>
  );
};

const Calendar = ({ monthDays, moveTherapist, removeTherapist, todayDate, blockedDaysForYear }) => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDayOfMonth = monthDays.length > 0 ? monthDays[0].date.getDay() : 0;

  return (
    <>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px',
        marginTop: '24px', marginBottom: '12px', fontWeight: '500',
        color: '#525252', textAlign: 'center', fontSize: '0.875rem',
        padding: '0 4px'
      }}>
        {daysOfWeek.map(dayName => <div key={dayName}>{dayName}</div>)}
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))', gap: '10px',
      }}>
        {Array.from({ length: firstDayOfMonth }).map((_, index) => (
          <div key={`empty-${index}`} style={{
            backgroundColor: '#fafafa', borderRadius: '12px', minHeight: '160px',
          }} />
        ))}
        {monthDays.map((day) => {
          const isToday = todayDate && day.date.toDateString() === todayDate.toDateString();
          const isBlocked = blockedDaysForYear.includes(day.dayKey);
          return (
            <CalendarDay
              key={`${day.dayKey}-${day.therapists.length}-${day.therapists.join(',')}`}
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

const TherapistList = React.memo(({ therapistGroups, collapsedRoles, toggleCollapse }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px',
      border: '1px solid #f0f0f0', marginBottom: '0'
    }}>
      <h2 style={{
        marginTop: '0', marginBottom: '12px', color: '#1a1a1a',
        fontSize: '1rem', fontWeight: '600', letterSpacing: '-0.01em'
      }}>
        Therapists
      </h2>
      <div style={{ paddingTop: '0' }}>
        {therapistGroups.map((group) => (
          <div key={group.role} style={{ marginBottom: '12px' }}>
            <button
              onClick={() => toggleCollapse(group.role)}
              style={{
                background: 'transparent', border: 'none', padding: '6px 8px',
                fontSize: '0.875rem', fontWeight: '500', color: '#525252',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                width: '100%', textAlign: 'left', outline: 'none',
                transition: 'all 0.15s ease', borderRadius: '6px',
                marginBottom: '6px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.color = '#1a1a1a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#525252';
              }}
            >
              <span style={{
                marginRight: '8px', color: '#a0a0a0', fontSize: '0.875rem',
                fontWeight: '600', lineHeight: '1', width: '14px',
                display: 'inline-block', textAlign: 'center',
                backgroundColor: '#f0f0f0', borderRadius: '3px',
                height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {collapsedRoles[group.role] ? '+' : '−'}
              </span>
              {group.role}
              <span style={{
                marginLeft: 'auto', fontSize: '0.75rem', color: '#a0a0a0',
                backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '10px'
              }}>
                {group.therapists.length}
              </span>
            </button>
            {!collapsedRoles[group.role] && (
              <div style={{
                display: 'flex', flexDirection: 'column', gap: '4px',
                marginTop: '6px', paddingLeft: '22px',
              }}>
                {group.therapists.map((name) => (
                  <Therapist key={name} name={name} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

const WFHTable = React.memo(({ therapists, workingFromHome, setWorkingFromHome }) => {
  return (
    <div style={{
      backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px',
      border: '1px solid #f0f0f0', marginBottom: '0'
    }}>
      <h3 style={{
        marginTop: '0', marginBottom: '12px', color: '#1a1a1a',
        fontSize: '1rem', fontWeight: '600', letterSpacing: '-0.01em'
      }}>
        Work From Home Days
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {therapists.map((therapist) => (
          <div key={therapist} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '8px 12px', backgroundColor: '#f8fafc',
            borderRadius: '8px', border: '1px solid #f0f0f0'
          }}>
            <div style={{
              minWidth: '80px', fontSize: '0.875rem', fontWeight: '500',
              color: '#1a1a1a', flexShrink: 0
            }}>
              {therapist.split(' ')[0]}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((dayAbbr, index) => {
                const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][index];
                const isChecked = workingFromHome[therapist]?.[fullDay] || false;
                return (
                  <label key={dayAbbr} style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.75rem', cursor: 'pointer',
                    padding: '4px 8px', borderRadius: '6px',
                    backgroundColor: isChecked ? '#dbeafe' : 'transparent',
                    color: isChecked ? '#1e40af' : '#525252',
                    transition: 'all 0.15s ease'
                  }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        setWorkingFromHome((prev) => ({
                          ...prev,
                          [therapist]: {
                            ...prev[therapist],
                            [fullDay]: !prev[therapist]?.[fullDay],
                          },
                        }))
                      }
                      style={{ 
                        cursor: 'pointer', accentColor: '#0ea5e9',
                        transform: 'scale(0.8)'
                      }}
                    />
                    {dayAbbr}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

const AssignmentTracker = React.memo(({ therapists, assignmentCounts, averageShiftsPerTherapist, workingFromHome }) => {
  const getColorForAssignmentCount = useCallback((count) => {
    if (averageShiftsPerTherapist === 0 || therapists.length === 0) return '#A0AEC0';
    const avg = parseFloat(averageShiftsPerTherapist);
    if (count < avg * 0.75) return '#68D391';
    if (count > avg * 1.25) return '#FC8181';
    if (count > avg) return '#F6AD55';
    return '#4FD1C5';
  }, [averageShiftsPerTherapist, therapists.length]);

  const sortedTherapists = useMemo(() => {
    return [...therapists].sort((a, b) => {
      const countA = assignmentCounts[a] || 0;
      const countB = assignmentCounts[b] || 0;
      if (countA !== countB) {
        return countA - countB;
      }
      return a.localeCompare(b);
    });
  }, [therapists, assignmentCounts]);

  return (
    <div style={{
      backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px',
      border: '1px solid #f0f0f0', marginBottom: '0'
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{
          margin: '0', color: '#1a1a1a', fontSize: '1rem', fontWeight: '600',
          letterSpacing: '-0.01em'
        }}>
          Shift Tracker
        </h3>
        <div style={{
          fontSize: '0.75rem', color: '#a0a0a0', backgroundColor: '#f8fafc',
          padding: '4px 8px', borderRadius: '6px', border: '1px solid #f0f0f0'
        }}>
          Avg: {averageShiftsPerTherapist}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {sortedTherapists.map((therapist) => {
          const count = assignmentCounts[therapist] || 0;
          const assignmentColor = getColorForAssignmentCount(count);
          const therapistWfhDays = Object.entries(workingFromHome[therapist] || {})
            .filter(([, isWfh]) => isWfh)
            .map(([day]) => day.substring(0, 3));
          return (
            <div
              key={therapist}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', backgroundColor: '#f8fafc',
                borderRadius: '8px', border: '1px solid #f0f0f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  backgroundColor: assignmentColor, flexShrink: 0,
                }} title={`Assignment Status: ${count} shifts`}></span>
                <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#1a1a1a' }}>
                  {therapist.split(' ')[0]}
                </span>
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: '600', color: '#525252',
                backgroundColor: '#ffffff', padding: '2px 6px', borderRadius: '4px',
                border: '1px solid #e0e0e0'
              }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const CalendarControls = React.memo(({ currentYear, currentMonth, liveDateTime, setCurrentYear, changeMonth }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
      <h2 style={{ color: '#1a1a1a', margin: 0, fontSize: '1.75rem', fontWeight: '500', letterSpacing: '-0.02em' }}>
        {new Date(currentYear, currentMonth, 1).toLocaleString("default", { month: "long" })} {currentYear}
        <span className="generated-text" style={{ fontSize: '0.75rem', color: '#a0a0a0', marginLeft: '12px', fontWeight: '400' }}>
          Generated: {liveDateTime}
        </span>
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={currentYear}
          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
          style={{
            padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '8px',
            backgroundColor: '#ffffff', fontSize: '0.875rem', cursor: 'pointer', outline: 'none',
            color: '#525252', fontWeight: '500'
          }}
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
        <button
          type="button"
          style={{ ...buttonStyle, marginRight: '8px' }}
          onClick={() => changeMonth('prev')}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#d0d0d0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
        >
          ← Previous
        </button>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => changeMonth('next')}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#d0d0d0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#e5e5e5'; }}
        >
          Next →
        </button>
      </div>
    </div>
  );
});

const ActionButtons = React.memo(({ goToToday, autoRoster, resetCalendar, saveAsPNG, downloadCsv, generateShareLink }) => {

  // New, standardized style objects
  const buttonStyle = {
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.875rem',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    border: '1px solid',
    outline: 'none'
  };

  const primaryBtn = {
    ...buttonStyle,
    backgroundColor: '#0ea5e9', // Blue
    color: 'white',
    borderColor: '#0ea5e9',
    onMouseEnter: (e) => { e.currentTarget.style.backgroundColor = '#0284c7'; e.currentTarget.style.borderColor = '#0284c7'; },
    onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = '#0ea5e9'; e.currentTarget.style.borderColor = '#0ea5e9'; },
  };

  const dangerBtn = {
    ...buttonStyle,
    backgroundColor: '#ef4444', // Red
    color: 'white',
    borderColor: '#ef4444',
    onMouseEnter: (e) => { e.currentTarget.style.backgroundColor = '#dc2626'; e.currentTarget.style.borderColor = '#dc2626'; },
    onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.borderColor = '#ef4444'; },
  };

  const successBtn = {
    ...buttonStyle,
    backgroundColor: '#10b981', // Green
    color: 'white',
    borderColor: '#10b981',
    onMouseEnter: (e) => { e.currentTarget.style.backgroundColor = '#059669'; e.currentTarget.style.borderColor = '#059669'; },
    onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = '#10b981'; e.currentTarget.style.borderColor = '#10b981'; },
  };

  const neutralBtn = {
    ...buttonStyle,
    backgroundColor: '#ffffff', // Light Gray
    color: '#525252',
    borderColor: '#e5e5e5',
    onMouseEnter: (e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#d0d0d0'; },
    onMouseLeave: (e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.borderColor = '#e5e5e5'; },
  };

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
      {/* Primary Action */}
      <button
        type="button"
        style={primaryBtn}
        onClick={autoRoster}
        onMouseEnter={primaryBtn.onMouseEnter}
        onMouseLeave={primaryBtn.onMouseLeave}
      >
        Auto Roster
      </button>

      {/* Danger/Warning Action */}
      <button
        type="button"
        style={dangerBtn}
        onClick={resetCalendar}
        onMouseEnter={dangerBtn.onMouseEnter}
        onMouseLeave={dangerBtn.onMouseLeave}
      >
        Reset Calendar
      </button>

      {/* Success Actions */}
      <button
        type="button"
        style={successBtn}
        onClick={goToToday}
        onMouseEnter={successBtn.onMouseEnter}
        onMouseLeave={successBtn.onMouseLeave}
      >
        Today
      </button>
      <button
        type="button"
        style={successBtn}
        onClick={downloadCsv}
        onMouseEnter={successBtn.onMouseEnter}
        onMouseLeave={successBtn.onMouseLeave}
      >
        Download CSV
      </button>

      {/* Neutral/Utility Actions */}
      <button
        type="button"
        style={neutralBtn}
        onClick={saveAsPNG}
        onMouseEnter={neutralBtn.onMouseEnter}
        onMouseLeave={neutralBtn.onMouseLeave}
      >
        Save as PNG
      </button>
      <button
        type="button"
        style={neutralBtn}
        onClick={generateShareLink}
        onMouseEnter={neutralBtn.onMouseEnter}
        onMouseLeave={neutralBtn.onMouseLeave}
      >
        Share Link
      </button>
    </div>
  );
});

const PatchNotesSection = React.memo(({ patchNotes }) => {
  return (
    <div style={{ padding: '0px 12px' }}>
      <h2 style={{ marginTop: 0, marginBottom: '24px', color: '#1a1a1a', fontSize: '1.5rem', fontWeight: '500', letterSpacing: '-0.02em' }}>Application Patch Notes</h2>
      {patchNotes.map((patch, index) => (
        <div key={index} style={{ marginBottom: '32px', paddingBottom: '20px', borderBottom: '1px solid #f0f0f0' }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1a1a1a', fontSize: '1.1rem', fontWeight: '500' }}>
            Version {patch.version} <span style={{ fontSize: '0.8rem', color: '#a0a0a0', fontWeight: '400' }}>({patch.date})</span>
          </h3>
          <ul style={{ listStyleType: 'none', paddingLeft: '0', margin: 0 }}>
            {patch.changes.map((change, i) => (
              <li key={i} style={{ marginBottom: '8px', color: '#525252', lineHeight: '1.5', paddingLeft: '16px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0', color: '#d0d0d0' }}>•</span>{change}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p style={{ fontSize: '0.875rem', color: '#a0a0a0', textAlign: 'center', marginTop: '40px', fontStyle: 'italic' }}>End of Patch Notes.</p>
    </div>
  );
});

// --- Main App Component ---
const App = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [activeTab, setActiveTab] = useState('calendar');
  const [liveDateTime, setLiveDateTime] = useState('');
  
  const sidebarRef = useRef(null);
  const mainContentRef = useRef(null);

  const calendarRef = useRef(null);

  const initialCollapsedRolesState = useMemo(() => (
    therapistGroups.reduce((acc, group) => {
      acc[group.role] = false;
      return acc;
    }, {})
  ), []);
  const [collapsedRoles, setCollapsedRoles] = useState(initialCollapsedRolesState);

  const [calendarData, setCalendarData] = useState(() => ({
    2025: getCalendarForYear(2025),
    2026: getCalendarForYear(2026),
  }));

  const [todayDate, setTodayDate] = useState(null);

  const [workingFromHome, setWorkingFromHome] = useState(
    {
      "Dominic Yeo": { Monday: false, Tuesday: false, Wednesday: true, Thursday: false, Friday: false },
      "Kirsty Png": { Monday: false, Tuesday: false, Wednesday: true, Thursday: false, Friday: false },
      "Jiaying Soon": { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: true },
      "Andrew Lim": { Monday: false, Tuesday: false, Wednesday: false, Thursday: false, Friday: true },
      "Janice Leong": { Monday: false, Tuesday: false, Wednesday: true, Thursday: false, Friday: false },
      "Oliver Tan": { Monday: false, Tuesday: true, Wednesday: false, Thursday: false, Friday: false },
      "Claudia Ahl": { Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false },
      "Seanna Neo": { Monday: false, Tuesday: true, Wednesday: false, Thursday: false, Friday: false },
      "XH Xiao": { Monday: false, Tuesday: false, Wednesday: false, Thursday: true, Friday: false },
    }
  );

  const currentBlockedDays = useMemo(() => (
    currentYear === 2025 ? blockedDays2025 : blockedDays2026
  ), [currentYear]);

  // --- Start of Tracker Section Calculations (Memoized for performance) ---
  const assignmentCounts = useMemo(() => {
    return therapists.reduce((acc, therapist) => {
      acc[therapist] = calendarData[currentYear]?.[currentMonth]?.filter((day) =>
        day.therapists.includes(therapist)
      ).length || 0;
      return acc;
    }, {});
  }, [calendarData, currentYear, currentMonth]);

  const totalAssignedShiftsOverall = useMemo(() => (
    Object.values(assignmentCounts).reduce((sum, count) => sum + count, 0)
  ), [assignmentCounts]);

  const averageShiftsPerTherapist = useMemo(() => (
    therapists.length > 0
      ? (totalAssignedShiftsOverall / therapists.length).toFixed(1)
      : 0
  ), [totalAssignedShiftsOverall, therapists.length]);
  // --- End of Tracker Section Calculations ---

  const actualCurrentDate = useMemo(() => new Date(), []);
  const actualCurrentDay = useMemo(() => actualCurrentDate.getDate(), [actualCurrentDate]);
  const actualCurrentMonthIndex = useMemo(() => actualCurrentDate.getMonth(), [actualCurrentDate]);
  const actualCurrentYear = useMemo(() => actualCurrentDate.getFullYear(), [actualCurrentDate]);

  // Effect hook to manage 'today' highlight and month display when the year changes
  useEffect(() => {
    setTodayDate(null);
    if (currentYear === actualCurrentYear) {
      setCurrentMonth(actualCurrentMonthIndex);
      setTodayDate(new Date(actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay));
    } else {
      setCurrentMonth(0);
    }
  }, [currentYear, actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay]);

  // Effect hook to update live date and time every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setLiveDateTime(now.toLocaleString('en-SG', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }));
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Effect hook to parse URL for shared data on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('data');

    if (sharedData) {
      const decompressed = decompressData(sharedData);

      if (decompressed) {
        setCalendarData(decompressed.calendarData);
        setWorkingFromHome(decompressed.workingFromHome);
        toast.success("Calendar loaded from shared link!", { position: "top-center" });
      } else {
        toast.error("Failed to load shared data.", { position: "top-center" });
      }
    }
  }, []);

  // Effect hook to restore scroll position when switching tabs
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const moveTherapist = useCallback((therapistName, dayKey) => {
    setCalendarData(prevData => {
      const newData = { ...prevData };
      const [year, month, day] = dayKey.split('-').map(Number);
      const targetDay = newData[year][month - 1].find(d => d.dayKey === dayKey);

      if (targetDay) {
        // Prevent adding a therapist who is already on the day
        if (!targetDay.therapists.includes(therapistName)) {
          targetDay.therapists = [...targetDay.therapists, therapistName];
        }
      }
      return newData;
    });
  }, []);

  const removeTherapist = useCallback((therapistName, dayKey) => {
    console.log('=== REMOVE THERAPIST DEBUG ===');
    console.log('Removing therapist:', therapistName, 'from day:', dayKey);
    console.log('Current year/month:', currentYear, currentMonth);
    
    setCalendarData(prevData => {
      console.log('Previous calendar data:', prevData);
      const newData = { ...prevData };
      const [year, month, day] = dayKey.split('-').map(Number);
      console.log('Parsed date parts:', { year, month, day });
      
      const targetDay = newData[year][month - 1].find(d => d.dayKey === dayKey);
      console.log('Target day found:', targetDay);

      if (targetDay) {
        console.log('Before removal - targetDay.therapists:', targetDay.therapists);
        const beforeLength = targetDay.therapists.length;
        
        // Create a new array instead of mutating the existing one
        const newTherapists = targetDay.therapists.filter(
          (therapist) => therapist !== therapistName
        );
        
        // Create a new day object instead of mutating
        const updatedDay = {
          ...targetDay,
          therapists: newTherapists
        };
        
        // Replace the day in the month array
        const monthIndex = month - 1;
        newData[year][monthIndex] = newData[year][monthIndex].map(d => 
          d.dayKey === dayKey ? updatedDay : d
        );
        
        const afterLength = newTherapists.length;
        console.log('After removal - newTherapists:', newTherapists);
        console.log('Removal result - before:', beforeLength, 'after:', afterLength);
      } else {
        console.error('Target day not found!');
      }
      
      console.log('New calendar data:', newData);
      console.log('=== END REMOVE DEBUG ===');
      return newData;
    });
  }, [currentYear, currentMonth]);

  const changeMonth = useCallback((direction) => {
    setCurrentMonth(prevMonth => {
      if (direction === 'prev') {
        if (prevMonth === 0) {
          setCurrentYear(prevYear => prevYear - 1);
          return 11;
        }
        return prevMonth - 1;
      } else {
        if (prevMonth === 11) {
          setCurrentYear(prevYear => prevYear + 1);
          return 0;
        }
        return prevMonth + 1;
      }
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentYear(actualCurrentYear);
    setCurrentMonth(actualCurrentMonthIndex);
    setTodayDate(new Date(actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay));
  }, [actualCurrentYear, actualCurrentMonthIndex, actualCurrentDay]);

  const autoRoster = useCallback(() => {
    const monthData = calendarData[currentYear][currentMonth];
    const daysInMonth = monthData.length;
    const workingDays = monthData.filter(day => {
      const dayDate = new Date(day.dayKey);
      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
      const isHoliday = currentBlockedDays.includes(day.dayKey);
      return !isWeekend && !isHoliday;
    });

    if (workingDays.length === 0) {
      toast.info("No working days in this month to auto-roster.", { position: "top-center" });
      return;
    }

    const assignedCount = {};
    therapists.forEach(t => assignedCount[t] = 0);

    const newCalendarData = { ...calendarData };
    newCalendarData[currentYear][currentMonth] = monthData.map(day => ({
      ...day,
      therapists: []
    }));

    workingDays.forEach(day => {
      const dayDate = new Date(day.dayKey);
      const dayOfWeek = dayDate.toLocaleString('en-US', { weekday: 'long' });

      const availableTherapists = therapists.filter(therapist => {
        const isWfh = workingFromHome[therapist]?.[dayOfWeek];
        return !isWfh;
      });

      if (availableTherapists.length > 0) {
        // Sort by least assigned therapist, then alphabetically
        const sortedTherapists = [...availableTherapists].sort((a, b) => {
          const countA = assignedCount[a];
          const countB = assignedCount[b];
          if (countA !== countB) {
            return countA - countB;
          }
          return a.localeCompare(b);
        });
        const assignedTherapist = sortedTherapists[0];
        const updatedDay = newCalendarData[currentYear][currentMonth].find(d => d.dayKey === day.dayKey);
        if (updatedDay) {
          updatedDay.therapists.push(assignedTherapist);
          assignedCount[assignedTherapist] += 1;
        }
      }
    });

    setCalendarData(newCalendarData);
    toast.success("Roster automatically generated!", { position: "top-center" });
  }, [calendarData, currentYear, currentMonth, therapists, currentBlockedDays, workingFromHome]);

  const resetCalendar = useCallback(() => {
    if (window.confirm("Are you sure you want to reset this month's calendar? This action cannot be undone.")) {
      setCalendarData(prevData => {
        const newData = { ...prevData };
        newData[currentYear][currentMonth] = getCalendarForYear(currentYear)[currentMonth];
        return newData;
      });
      toast.info("Calendar for the month has been reset.", { position: "top-center" });
    }
  }, [currentYear, currentMonth]);

  const downloadCsv = useCallback(() => {
    const monthData = calendarData[currentYear][currentMonth];
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Date,Day,Therapists\n`;

    monthData.forEach(day => {
      const dayOfWeek = day.date.toLocaleString('en-US', { weekday: 'short' });
      const therapistsList = day.therapists.join('; ');
      const row = `${day.dayKey},${dayOfWeek},"${therapistsList}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Therapist-Roster-${currentYear}-${currentMonth + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded!", { position: "top-center" });
  }, [calendarData, currentYear, currentMonth]);

  const generateShareLink = useCallback(() => {
    const dataToShare = {
      calendarData: calendarData,
      workingFromHome: workingFromHome
    };
    const compressed = compressData(dataToShare);
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${compressed}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success("Shareable link copied to clipboard!", { position: "top-center" });
      })
      .catch(() => {
        toast.error("Failed to copy link.", { position: "top-center" });
      });
  }, [calendarData, workingFromHome]);

  const toggleCollapse = useCallback((role) => {
    setCollapsedRoles(prev => ({
      ...prev,
      [role]: !prev[role],
    }));
  }, []);

  const saveAsPNG = useCallback(() => {
    const calendarElement = calendarRef.current;
    if (!calendarElement) {
      toast.error("Calendar element not found!", { position: "top-center" });
      return;
    }

    const currentMonthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });
    const fileName = `Therapist-Roster-${currentMonthName}-${currentYear}.png`;

    // Create a temporary wrapper to contain the calendar and title for the screenshot
    const screenshotWrapper = document.createElement('div');
    screenshotWrapper.id = 'screenshot-wrapper';
    screenshotWrapper.style.backgroundColor = '#FFFFFF';
    screenshotWrapper.style.padding = '20px';
    document.body.appendChild(screenshotWrapper);

    // Create and append a temporary title element to the wrapper
    const titleDiv = document.createElement('div');
    titleDiv.textContent = `${currentMonthName} ${currentYear}`;
    Object.assign(titleDiv.style, {
      fontSize: '2rem',
      fontWeight: 'bold',
      textAlign: 'center',
      color: '#1A202C',
      padding: '10px 0 20px 0',
    });
    screenshotWrapper.appendChild(titleDiv);

    // Temporarily move the calendar element into the wrapper
    const originalParent = calendarElement.parentNode;
    screenshotWrapper.appendChild(calendarElement);

    // Temporarily adjust styles for the screenshot
    const originalCalendarStyle = calendarElement.style.cssText;
    calendarElement.style.cssText = 'width: fit-content; overflow: hidden;';
    
    // Adjust calendar day styles for the screenshot
    const dayElements = calendarElement.querySelectorAll('.CalendarDay_root');
    dayElements.forEach(el => {
      el.style.minHeight = '120px';
      el.style.overflow = 'hidden';
    });

    const weekendElements = calendarElement.querySelectorAll('.weekend-day');
    weekendElements.forEach(el => {
      el.style.minHeight = '60px';
    });

    setTimeout(() => {
      html2canvas(screenshotWrapper, {
        useCORS: true,
        scale: 2,
        backgroundColor: null,
      }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Calendar saved as PNG!", { position: "top-center" });
      }).catch(error => {
        console.error('Error saving image:', error);
        toast.error('Failed to save PNG.');
      }).finally(() => {
        // Restore original styles and DOM structure
        if (originalParent) {
          originalParent.appendChild(calendarElement);
        }
        calendarElement.style.cssText = originalCalendarStyle;
        dayElements.forEach(el => {
          el.style.minHeight = '';
          el.style.overflow = '';
        });
        weekendElements.forEach(el => {
          el.style.minHeight = '';
        });
        screenshotWrapper.remove();
      });
    }, 100);
  }, [currentYear, currentMonth]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{
        display: 'flex', height: '100vh', backgroundColor: '#fafafa',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        overflow: 'hidden'
      }}>
        <ToastContainer />
        {/* Left Sidebar */}
        <div 
          ref={sidebarRef}
          className="smooth-scroll"
          style={{
            width: '320px', height: '100vh', padding: '20px', 
            borderRight: '1px solid #f0f0f0', backgroundColor: '#ffffff', 
            display: 'flex', flexDirection: 'column', gap: '16px', 
            flexShrink: 0, overflowY: 'auto', overflowX: 'hidden',
            position: 'sticky', top: 0
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'
          }}>
            <div style={{
              width: '32px', height: '32px', backgroundColor: '#0ea5e9',
              borderRadius: '8px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontWeight: '600',
              fontSize: '1rem'
            }}>
              S
            </div>
            <h1 style={{
              color: '#1a1a1a', fontSize: '1.25rem', fontWeight: '600',
              margin: '0', letterSpacing: '-0.02em'
            }}>
              SWEE Roster
            </h1>
          </div>
          
          <div style={{
            width: '100%', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <TherapistList
              therapistGroups={therapistGroups}
              collapsedRoles={collapsedRoles}
              toggleCollapse={toggleCollapse}
            />
            {activeTab === 'calendar' && (
              <>
                <WFHTable
                  therapists={therapists}
                  workingFromHome={workingFromHome}
                  setWorkingFromHome={setWorkingFromHome}
                />
                <AssignmentTracker
                  therapists={therapists}
                  assignmentCounts={assignmentCounts}
                  averageShiftsPerTherapist={averageShiftsPerTherapist}
                  workingFromHome={workingFromHome}
                />
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div 
          ref={mainContentRef}
          className="smooth-scroll"
          style={{ 
            flex: 1, padding: '48px', 
            overflowY: 'auto', overflowX: 'hidden', 
            backgroundColor: '#fafafa',
            position: 'relative'
          }}
        >
          <div style={{
            display: 'flex', borderBottom: '1px solid #f0f0f0',
            marginBottom: '32px'
          }}>
            <button
              onClick={() => setActiveTab('calendar')}
              style={{
                ...tabButtonStyle,
                color: activeTab === 'calendar' ? '#0ea5e9' : '#a0a0a0',
                borderBottom: activeTab === 'calendar' ? '2px solid #0ea5e9' : '2px solid transparent'
              }}
            >
              Calendar
            </button>
            <button
              onClick={() => setActiveTab('patch-notes')}
              style={{
                ...tabButtonStyle,
                color: activeTab === 'patch-notes' ? '#0ea5e9' : '#a0a0a0',
                borderBottom: activeTab === 'patch-notes' ? '2px solid #0ea5e9' : '2px solid transparent'
              }}
            >
              Patch Notes
            </button>
          </div>

          {activeTab === 'calendar' && (
            <div style={{ minHeight: '100%' }}>
              <CalendarControls
                currentYear={currentYear}
                currentMonth={currentMonth}
                liveDateTime={liveDateTime}
                setCurrentYear={setCurrentYear}
                changeMonth={changeMonth}
              />
              <ActionButtons
                goToToday={goToToday}
                autoRoster={autoRoster}
                resetCalendar={resetCalendar}
                saveAsPNG={saveAsPNG}
                downloadCsv={downloadCsv}
                generateShareLink={generateShareLink}
              />
              <div ref={calendarRef}>
                <Calendar
                  monthDays={calendarData[currentYear][currentMonth]}
                  moveTherapist={moveTherapist}
                  removeTherapist={removeTherapist}
                  todayDate={todayDate}
                  blockedDaysForYear={currentBlockedDays}
                />
              </div>
            </div>
          )}

          {activeTab === 'patch-notes' && (
            <PatchNotesSection patchNotes={patchNotes} />
          )}

        </div>
      </div>
    </DndProvider>
  );
};

export default App;












