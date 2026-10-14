// The little line icons used on buttons. aria-hidden: the button's aria-label already says what it does.
function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

// A clock with an arrow around it: the usual "history" icon.
export const HistoryIcon = () => (
  <Icon>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5" />
    <path d="M12 7v5l3 2" />
  </Icon>
)

export const BackIcon = () => (
  <Icon>
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </Icon>
)

export const BinIcon = () => (
  <Icon>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M6 6l1 14h10l1-14" />
    <path d="M10 10v6" />
    <path d="M14 10v6" />
  </Icon>
)
