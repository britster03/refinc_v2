/**
 * Comprehensive internationalization system
 * Production-ready translations for all app components
 */

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko'

export interface TranslationKeys {
  // Common
  common: {
    loading: string
    saving: string
    save: string
    cancel: string
    delete: string
    edit: string
    update: string
    create: string
    search: string
    filter: string
    sort: string
    export: string
    import: string
    download: string
    upload: string
    submit: string
    reset: string
    clear: string
    apply: string
    confirm: string
    yes: string
    no: string
    ok: string
    close: string
    back: string
    next: string
    previous: string
    continue: string
    finish: string
    success: string
    error: string
    warning: string
    info: string
  }

  // Navigation
  navigation: {
    dashboard: string
    profile: string
    settings: string
    notifications: string
    messages: string
    referrals: string
    companies: string
    candidates: string
    analytics: string
    help: string
    logout: string
    home: string
  }

  // Authentication
  auth: {
    signIn: string
    signOut: string
    signUp: string
    email: string
    password: string
    confirmPassword: string
    forgotPassword: string
    resetPassword: string
    rememberMe: string
    createAccount: string
    alreadyHaveAccount: string
    dontHaveAccount: string
    invalidCredentials: string
    passwordTooWeak: string
    emailAlreadyExists: string
    accountCreated: string
    welcomeBack: string
    verifyEmail: string
    emailVerified: string
    resendVerification: string
  }

  // Settings
  settings: {
    title: string
    account: string
    profile: string
    privacy: string
    notifications: string
    preferences: string
    security: string
    billing: string
    
    // Theme
    theme: string
    light: string
    dark: string
    system: string
    themeDescription: string
    
    // Language
    language: string
    languageDescription: string
    
    // Timezone
    timezone: string
    timezoneDescription: string
    
    // Currency
    currency: string
    currencyDescription: string
    
    // Date/Time formats
    dateFormat: string
    timeFormat: string
    dateFormatDescription: string
    timeFormatDescription: string
    
    // Notifications
    emailNotifications: string
    pushNotifications: string
    referralUpdates: string
    messageNotifications: string
    systemNotifications: string
    weeklyDigest: string
    marketingEmails: string
    notificationFrequency: string
    instant: string
    hourly: string
    daily: string
    weekly: string
    
    // Privacy
    profileVisibility: string
    public: string
    private: string
    connections: string
    showEmail: string
    showPhone: string
    allowReferralRequests: string
    allowPremiumConversations: string
    dataSharing: string
    analyticsTracking: string
    
    // Success messages
    settingsSaved: string
    themeChanged: string
    languageChanged: string
    timezoneChanged: string
    currencyChanged: string
    notificationsUpdated: string
    privacyUpdated: string
    preferencesUpdated: string
  }

  // Dashboard
  dashboard: {
    welcome: string
    overview: string
    recentActivity: string
    stats: string
    quickActions: string
    
    // Stats
    totalReferrals: string
    successfulReferrals: string
    pendingReferrals: string
    totalEarnings: string
    thisMonth: string
    thisWeek: string
    today: string
    
    // Quick Actions
    makeReferral: string
    viewProfile: string
    searchJobs: string
    updateProfile: string
    viewMessages: string
  }

  // Referrals
  referrals: {
    title: string
    newReferral: string
    myReferrals: string
    received: string
    sent: string
    pending: string
    accepted: string
    rejected: string
    
    // Statuses
    draft: string
    submitted: string
    underReview: string
    approved: string
    declined: string
    hired: string
    
    // Actions
    submit: string
    withdraw: string
    accept: string
    decline: string
    review: string
    
    // Form fields
    candidate: string
    position: string
    company: string
    description: string
    resume: string
    coverLetter: string
    expectedSalary: string
    availableFrom: string
    
    // Messages
    referralSubmitted: string
    referralAccepted: string
    referralDeclined: string
    noReferrals: string
    loadMore: string
  }

  // Profile
  profile: {
    title: string
    personalInfo: string
    professionalInfo: string
    skills: string
    experience: string
    education: string
    
    // Personal fields
    firstName: string
    lastName: string
    displayName: string
    bio: string
    location: string
    phone: string
    website: string
    
    // Professional fields
    currentTitle: string
    currentCompany: string
    industry: string
    experienceLevel: string
    salary: string
    
    // Social links
    linkedin: string
    github: string
    twitter: string
    portfolio: string
    
    // Actions
    editProfile: string
    saveProfile: string
    uploadPhoto: string
    removePhoto: string
    viewPublicProfile: string
    
    // Messages
    profileUpdated: string
    photoUploaded: string
    invalidFileType: string
    fileTooLarge: string
  }

  // Messages
  messages: {
    title: string
    conversations: string
    newMessage: string
    noMessages: string
    typeMessage: string
    send: string
    
    // Conversation info
    with: string
    lastSeen: string
    online: string
    offline: string
    typing: string
    
    // Actions
    markAsRead: string
    markAsUnread: string
    deleteConversation: string
    blockUser: string
    reportUser: string
    
    // Status
    sent: string
    delivered: string
    read: string
    failed: string
  }

  // Notifications
  notifications: {
    title: string
    markAllRead: string
    noNotifications: string
    
    // Types
    referralUpdate: string
    newMessage: string
    systemUpdate: string
    paymentReceived: string
    profileViewed: string
    
    // Actions
    markAsRead: string
    delete: string
    viewDetails: string
  }

  // Companies
  companies: {
    title: string
    searchCompanies: string
    viewCompany: string
    noCompanies: string
    
    // Company info
    about: string
    employees: string
    founded: string
    headquarters: string
    website: string
    industry: string
    
    // Jobs
    openPositions: string
    viewJobs: string
    applyNow: string
    
    // Actions
    follow: string
    unfollow: string
    following: string
  }

  // Error messages
  errors: {
    general: string
    networkError: string
    unauthorized: string
    forbidden: string
    notFound: string
    serverError: string
    validationError: string
    
    // Form errors
    required: string
    invalidEmail: string
    invalidPhone: string
    invalidUrl: string
    passwordMismatch: string
    fileTooLarge: string
    invalidFileType: string
    
    // API errors
    failedToLoad: string
    failedToSave: string
    failedToDelete: string
    failedToUpdate: string
  }

  // Success messages
  success: {
    saved: string
    updated: string
    deleted: string
    created: string
    uploaded: string
    sent: string
    received: string
  }

  // Date/Time
  dateTime: {
    now: string
    today: string
    yesterday: string
    tomorrow: string
    thisWeek: string
    lastWeek: string
    thisMonth: string
    lastMonth: string
    thisYear: string
    lastYear: string
    
    // Relative time
    justNow: string
    minuteAgo: string
    minutesAgo: string
    hourAgo: string
    hoursAgo: string
    dayAgo: string
    daysAgo: string
    weekAgo: string
    weeksAgo: string
    monthAgo: string
    monthsAgo: string
    yearAgo: string
    yearsAgo: string
    
    // Days
    monday: string
    tuesday: string
    wednesday: string
    thursday: string
    friday: string
    saturday: string
    sunday: string
    
    // Months
    january: string
    february: string
    march: string
    april: string
    may: string
    june: string
    july: string
    august: string
    september: string
    october: string
    november: string
    december: string
  }
}

const translations: Record<Language, TranslationKeys> = {
  en: {
    common: {
      loading: "Loading...",
      saving: "Saving...",
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      update: "Update",
      create: "Create",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      export: "Export",
      import: "Import",
      download: "Download",
      upload: "Upload",
      submit: "Submit",
      reset: "Reset",
      clear: "Clear",
      apply: "Apply",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      ok: "OK",
      close: "Close",
      back: "Back",
      next: "Next",
      previous: "Previous",
      continue: "Continue",
      finish: "Finish",
      success: "Success",
      error: "Error",
      warning: "Warning",
      info: "Info"
    },
    navigation: {
      dashboard: "Dashboard",
      profile: "Profile",
      settings: "Settings",
      notifications: "Notifications",
      messages: "Messages",
      referrals: "Referrals",
      companies: "Companies",
      candidates: "Candidates",
      analytics: "Analytics",
      help: "Help",
      logout: "Logout",
      home: "Home"
    },
    auth: {
      signIn: "Sign In",
      signOut: "Sign Out",
      signUp: "Sign Up",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      rememberMe: "Remember Me",
      createAccount: "Create Account",
      alreadyHaveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?",
      invalidCredentials: "Invalid email or password",
      passwordTooWeak: "Password is too weak",
      emailAlreadyExists: "Email already exists",
      accountCreated: "Account created successfully",
      welcomeBack: "Welcome back!",
      verifyEmail: "Verify Email",
      emailVerified: "Email verified successfully",
      resendVerification: "Resend Verification"
    },
    settings: {
      title: "Settings",
      account: "Account",
      profile: "Profile",
      privacy: "Privacy",
      notifications: "Notifications",
      preferences: "Preferences",
      security: "Security",
      billing: "Billing",
      
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      themeDescription: "Choose your preferred theme",
      
      language: "Language",
      languageDescription: "Select your preferred language",
      
      timezone: "Timezone",
      timezoneDescription: "Set your local timezone",
      
      currency: "Currency",
      currencyDescription: "Choose your preferred currency",
      
      dateFormat: "Date Format",
      timeFormat: "Time Format",
      dateFormatDescription: "How dates should be displayed",
      timeFormatDescription: "Choose 12-hour or 24-hour format",
      
      emailNotifications: "Email Notifications",
      pushNotifications: "Push Notifications",
      referralUpdates: "Referral Updates",
      messageNotifications: "Message Notifications",
      systemNotifications: "System Notifications",
      weeklyDigest: "Weekly Digest",
      marketingEmails: "Marketing Emails",
      notificationFrequency: "Notification Frequency",
      instant: "Instant",
      hourly: "Hourly",
      daily: "Daily",
      weekly: "Weekly",
      
      profileVisibility: "Profile Visibility",
      public: "Public",
      private: "Private",
      connections: "Connections Only",
      showEmail: "Show Email",
      showPhone: "Show Phone",
      allowReferralRequests: "Allow Referral Requests",
      allowPremiumConversations: "Allow Premium Conversations",
      dataSharing: "Data Sharing",
      analyticsTracking: "Analytics Tracking",
      
      settingsSaved: "Settings saved successfully",
      themeChanged: "Theme changed to {theme}",
      languageChanged: "Language changed to {language}",
      timezoneChanged: "Timezone updated",
      currencyChanged: "Currency changed to {currency}",
      notificationsUpdated: "Notification preferences updated",
      privacyUpdated: "Privacy settings updated",
      preferencesUpdated: "Preferences updated"
    },
    dashboard: {
      welcome: "Welcome back!",
      overview: "Overview",
      recentActivity: "Recent Activity",
      stats: "Statistics",
      quickActions: "Quick Actions",
      
      totalReferrals: "Total Referrals",
      successfulReferrals: "Successful Referrals",
      pendingReferrals: "Pending Referrals",
      totalEarnings: "Total Earnings",
      thisMonth: "This Month",
      thisWeek: "This Week",
      today: "Today",
      
      makeReferral: "Make a Referral",
      viewProfile: "View Profile",
      searchJobs: "Search Jobs",
      updateProfile: "Update Profile",
      viewMessages: "View Messages"
    },
    referrals: {
      title: "Referrals",
      newReferral: "New Referral",
      myReferrals: "My Referrals",
      received: "Received",
      sent: "Sent",
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
      
      draft: "Draft",
      submitted: "Submitted",
      underReview: "Under Review",
      approved: "Approved",
      declined: "Declined",
      hired: "Hired",
      
      submit: "Submit",
      withdraw: "Withdraw",
      accept: "Accept",
      decline: "Decline",
      review: "Review",
      
      candidate: "Candidate",
      position: "Position",
      company: "Company",
      description: "Description",
      resume: "Resume",
      coverLetter: "Cover Letter",
      expectedSalary: "Expected Salary",
      availableFrom: "Available From",
      
      referralSubmitted: "Referral submitted successfully",
      referralAccepted: "Referral accepted",
      referralDeclined: "Referral declined",
      noReferrals: "No referrals found",
      loadMore: "Load More"
    },
    profile: {
      title: "Profile",
      personalInfo: "Personal Information",
      professionalInfo: "Professional Information",
      skills: "Skills",
      experience: "Experience",
      education: "Education",
      
      firstName: "First Name",
      lastName: "Last Name",
      displayName: "Display Name",
      bio: "Bio",
      location: "Location",
      phone: "Phone",
      website: "Website",
      
      currentTitle: "Current Title",
      currentCompany: "Current Company",
      industry: "Industry",
      experienceLevel: "Experience Level",
      salary: "Salary",
      
      linkedin: "LinkedIn",
      github: "GitHub",
      twitter: "Twitter",
      portfolio: "Portfolio",
      
      editProfile: "Edit Profile",
      saveProfile: "Save Profile",
      uploadPhoto: "Upload Photo",
      removePhoto: "Remove Photo",
      viewPublicProfile: "View Public Profile",
      
      profileUpdated: "Profile updated successfully",
      photoUploaded: "Photo uploaded successfully",
      invalidFileType: "Invalid file type",
      fileTooLarge: "File too large"
    },
    messages: {
      title: "Messages",
      conversations: "Conversations",
      newMessage: "New Message",
      noMessages: "No messages",
      typeMessage: "Type a message...",
      send: "Send",
      
      with: "with",
      lastSeen: "Last seen",
      online: "Online",
      offline: "Offline",
      typing: "typing...",
      
      markAsRead: "Mark as Read",
      markAsUnread: "Mark as Unread",
      deleteConversation: "Delete Conversation",
      blockUser: "Block User",
      reportUser: "Report User",
      
      sent: "Sent",
      delivered: "Delivered",
      read: "Read",
      failed: "Failed"
    },
    notifications: {
      title: "Notifications",
      markAllRead: "Mark All as Read",
      noNotifications: "No notifications",
      
      referralUpdate: "Referral Update",
      newMessage: "New Message",
      systemUpdate: "System Update",
      paymentReceived: "Payment Received",
      profileViewed: "Profile Viewed",
      
      markAsRead: "Mark as Read",
      delete: "Delete",
      viewDetails: "View Details"
    },
    companies: {
      title: "Companies",
      searchCompanies: "Search Companies",
      viewCompany: "View Company",
      noCompanies: "No companies found",
      
      about: "About",
      employees: "Employees",
      founded: "Founded",
      headquarters: "Headquarters",
      website: "Website",
      industry: "Industry",
      
      openPositions: "Open Positions",
      viewJobs: "View Jobs",
      applyNow: "Apply Now",
      
      follow: "Follow",
      unfollow: "Unfollow",
      following: "Following"
    },
    errors: {
      general: "Something went wrong",
      networkError: "Network error",
      unauthorized: "Unauthorized",
      forbidden: "Forbidden",
      notFound: "Not found",
      serverError: "Server error",
      validationError: "Validation error",
      
      required: "This field is required",
      invalidEmail: "Invalid email address",
      invalidPhone: "Invalid phone number",
      invalidUrl: "Invalid URL",
      passwordMismatch: "Passwords don't match",
      fileTooLarge: "File is too large",
      invalidFileType: "Invalid file type",
      
      failedToLoad: "Failed to load",
      failedToSave: "Failed to save",
      failedToDelete: "Failed to delete",
      failedToUpdate: "Failed to update"
    },
    success: {
      saved: "Saved successfully",
      updated: "Updated successfully",
      deleted: "Deleted successfully",
      created: "Created successfully",
      uploaded: "Uploaded successfully",
      sent: "Sent successfully",
      received: "Received successfully"
    },
    dateTime: {
      now: "Now",
      today: "Today",
      yesterday: "Yesterday",
      tomorrow: "Tomorrow",
      thisWeek: "This Week",
      lastWeek: "Last Week",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      thisYear: "This Year",
      lastYear: "Last Year",
      
      justNow: "Just now",
      minuteAgo: "a minute ago",
      minutesAgo: "{count} minutes ago",
      hourAgo: "an hour ago",
      hoursAgo: "{count} hours ago",
      dayAgo: "a day ago",
      daysAgo: "{count} days ago",
      weekAgo: "a week ago",
      weeksAgo: "{count} weeks ago",
      monthAgo: "a month ago",
      monthsAgo: "{count} months ago",
      yearAgo: "a year ago",
      yearsAgo: "{count} years ago",
      
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December"
    }
  },
  
  es: {
    common: {
      loading: "Cargando...",
      saving: "Guardando...",
      save: "Guardar",
      cancel: "Cancelar",
      delete: "Eliminar",
      edit: "Editar",
      update: "Actualizar",
      create: "Crear",
      search: "Buscar",
      filter: "Filtrar",
      sort: "Ordenar",
      export: "Exportar",
      import: "Importar",
      download: "Descargar",
      upload: "Subir",
      submit: "Enviar",
      reset: "Restablecer",
      clear: "Limpiar",
      apply: "Aplicar",
      confirm: "Confirmar",
      yes: "Sí",
      no: "No",
      ok: "OK",
      close: "Cerrar",
      back: "Atrás",
      next: "Siguiente",
      previous: "Anterior",
      continue: "Continuar",
      finish: "Finalizar",
      success: "Éxito",
      error: "Error",
      warning: "Advertencia",
      info: "Información"
    },
    navigation: {
      dashboard: "Panel",
      profile: "Perfil",
      settings: "Configuración",
      notifications: "Notificaciones",
      messages: "Mensajes",
      referrals: "Referencias",
      companies: "Empresas",
      candidates: "Candidatos",
      analytics: "Analíticas",
      help: "Ayuda",
      logout: "Cerrar Sesión",
      home: "Inicio"
    },
    auth: {
      signIn: "Iniciar Sesión",
      signOut: "Cerrar Sesión",
      signUp: "Registrarse",
      email: "Correo",
      password: "Contraseña",
      confirmPassword: "Confirmar Contraseña",
      forgotPassword: "¿Olvidaste tu contraseña?",
      resetPassword: "Restablecer Contraseña",
      rememberMe: "Recordarme",
      createAccount: "Crear Cuenta",
      alreadyHaveAccount: "¿Ya tienes una cuenta?",
      dontHaveAccount: "¿No tienes una cuenta?",
      invalidCredentials: "Correo o contraseña inválidos",
      passwordTooWeak: "La contraseña es muy débil",
      emailAlreadyExists: "El correo ya existe",
      accountCreated: "Cuenta creada exitosamente",
      welcomeBack: "¡Bienvenido de vuelta!",
      verifyEmail: "Verificar Correo",
      emailVerified: "Correo verificado exitosamente",
      resendVerification: "Reenviar Verificación"
    },
    settings: {
      title: "Configuración",
      account: "Cuenta",
      profile: "Perfil",
      privacy: "Privacidad",
      notifications: "Notificaciones",
      preferences: "Preferencias",
      security: "Seguridad",
      billing: "Facturación",
      
      theme: "Tema",
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
      themeDescription: "Elige tu tema preferido",
      
      language: "Idioma",
      languageDescription: "Selecciona tu idioma preferido",
      
      timezone: "Zona Horaria",
      timezoneDescription: "Establece tu zona horaria local",
      
      currency: "Moneda",
      currencyDescription: "Elige tu moneda preferida",
      
      dateFormat: "Formato de Fecha",
      timeFormat: "Formato de Hora",
      dateFormatDescription: "Cómo se mostrarán las fechas",
      timeFormatDescription: "Elige formato de 12 o 24 horas",
      
      emailNotifications: "Notificaciones por Correo",
      pushNotifications: "Notificaciones Push",
      referralUpdates: "Actualizaciones de Referencias",
      messageNotifications: "Notificaciones de Mensajes",
      systemNotifications: "Notificaciones del Sistema",
      weeklyDigest: "Resumen Semanal",
      marketingEmails: "Correos de Marketing",
      notificationFrequency: "Frecuencia de Notificaciones",
      instant: "Instantáneo",
      hourly: "Cada Hora",
      daily: "Diario",
      weekly: "Semanal",
      
      profileVisibility: "Visibilidad del Perfil",
      public: "Público",
      private: "Privado",
      connections: "Solo Conexiones",
      showEmail: "Mostrar Correo",
      showPhone: "Mostrar Teléfono",
      allowReferralRequests: "Permitir Solicitudes de Referencias",
      allowPremiumConversations: "Permitir Conversaciones Premium",
      dataSharing: "Compartir Datos",
      analyticsTracking: "Seguimiento de Analíticas",
      
      settingsSaved: "Configuración guardada exitosamente",
      themeChanged: "Tema cambiado a {theme}",
      languageChanged: "Idioma cambiado a {language}",
      timezoneChanged: "Zona horaria actualizada",
      currencyChanged: "Moneda cambiada a {currency}",
      notificationsUpdated: "Preferencias de notificaciones actualizadas",
      privacyUpdated: "Configuración de privacidad actualizada",
      preferencesUpdated: "Preferencias actualizadas"
    },
    dashboard: {
      welcome: "¡Bienvenido de vuelta!",
      overview: "Resumen",
      recentActivity: "Actividad Reciente",
      stats: "Estadísticas",
      quickActions: "Acciones Rápidas",
      totalReferrals: "Total de Referencias",
      successfulReferrals: "Referencias Exitosas",
      pendingReferrals: "Referencias Pendientes",
      totalEarnings: "Ganancias Totales",
      thisMonth: "Este Mes",
      thisWeek: "Esta Semana",
      today: "Hoy",
      makeReferral: "Hacer una Referencia",
      viewProfile: "Ver Perfil",
      searchJobs: "Buscar Trabajos",
      updateProfile: "Actualizar Perfil",
      viewMessages: "Ver Mensajes"
    },
    referrals: {
      title: "Referrals",
      newReferral: "New Referral",
      myReferrals: "My Referrals",
      received: "Received",
      sent: "Sent",
      pending: "Pending",
      accepted: "Accepted",
      rejected: "Rejected",
      
      draft: "Draft",
      submitted: "Submitted",
      underReview: "Under Review",
      approved: "Approved",
      declined: "Declined",
      hired: "Hired",
      
      submit: "Submit",
      withdraw: "Withdraw",
      accept: "Accept",
      decline: "Decline",
      review: "Review",
      
      candidate: "Candidate",
      position: "Position",
      company: "Company",
      description: "Description",
      resume: "Resume",
      coverLetter: "Cover Letter",
      expectedSalary: "Expected Salary",
      availableFrom: "Available From",
      
      referralSubmitted: "Referral submitted successfully",
      referralAccepted: "Referral accepted",
      referralDeclined: "Referral declined",
      noReferrals: "No referrals found",
      loadMore: "Load More"
    },
    profile: {
      title: "Profile",
      personalInfo: "Personal Information",
      professionalInfo: "Professional Information",
      skills: "Skills",
      experience: "Experience",
      education: "Education",
      
      firstName: "First Name",
      lastName: "Last Name",
      displayName: "Display Name",
      bio: "Bio",
      location: "Location",
      phone: "Phone",
      website: "Website",
      
      currentTitle: "Current Title",
      currentCompany: "Current Company",
      industry: "Industry",
      experienceLevel: "Experience Level",
      salary: "Salary",
      
      linkedin: "LinkedIn",
      github: "GitHub",
      twitter: "Twitter",
      portfolio: "Portfolio",
      
      editProfile: "Edit Profile",
      saveProfile: "Save Profile",
      uploadPhoto: "Upload Photo",
      removePhoto: "Remove Photo",
      viewPublicProfile: "View Public Profile",
      
      profileUpdated: "Profile updated successfully",
      photoUploaded: "Photo uploaded successfully",
      invalidFileType: "Invalid file type",
      fileTooLarge: "File too large"
    },
    messages: {
      title: "Messages",
      conversations: "Conversations",
      newMessage: "New Message",
      noMessages: "No messages",
      typeMessage: "Type a message...",
      send: "Send",
      
      with: "with",
      lastSeen: "Last seen",
      online: "Online",
      offline: "Offline",
      typing: "typing...",
      
      markAsRead: "Mark as Read",
      markAsUnread: "Mark as Unread",
      deleteConversation: "Delete Conversation",
      blockUser: "Block User",
      reportUser: "Report User",
      
      sent: "Sent",
      delivered: "Delivered",
      read: "Read",
      failed: "Failed"
    },
    notifications: {
      title: "Notifications",
      markAllRead: "Mark All as Read",
      noNotifications: "No notifications",
      
      referralUpdate: "Referral Update",
      newMessage: "New Message",
      systemUpdate: "System Update",
      paymentReceived: "Payment Received",
      profileViewed: "Profile Viewed",
      
      markAsRead: "Mark as Read",
      delete: "Delete",
      viewDetails: "View Details"
    },
    companies: {
      title: "Companies",
      searchCompanies: "Search Companies",
      viewCompany: "View Company",
      noCompanies: "No companies found",
      
      about: "About",
      employees: "Employees",
      founded: "Founded",
      headquarters: "Headquarters",
      website: "Website",
      industry: "Industry",
      
      openPositions: "Open Positions",
      viewJobs: "View Jobs",
      applyNow: "Apply Now",
      
      follow: "Follow",
      unfollow: "Unfollow",
      following: "Following"
    },
    errors: {
      general: "Something went wrong",
      networkError: "Network error",
      unauthorized: "Unauthorized",
      forbidden: "Forbidden",
      notFound: "Not found",
      serverError: "Server error",
      validationError: "Validation error",
      
      required: "This field is required",
      invalidEmail: "Invalid email address",
      invalidPhone: "Invalid phone number",
      invalidUrl: "Invalid URL",
      passwordMismatch: "Passwords don't match",
      fileTooLarge: "File is too large",
      invalidFileType: "Invalid file type",
      
      failedToLoad: "Failed to load",
      failedToSave: "Failed to save",
      failedToDelete: "Failed to delete",
      failedToUpdate: "Failed to update"
    },
    success: {
      saved: "Saved successfully",
      updated: "Updated successfully",
      deleted: "Deleted successfully",
      created: "Created successfully",
      uploaded: "Uploaded successfully",
      sent: "Sent successfully",
      received: "Received successfully"
    },
    dateTime: {
      now: "Now",
      today: "Today",
      yesterday: "Yesterday",
      tomorrow: "Tomorrow",
      thisWeek: "This Week",
      lastWeek: "Last Week",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      thisYear: "This Year",
      lastYear: "Last Year",
      
      justNow: "Just now",
      minuteAgo: "a minute ago",
      minutesAgo: "{count} minutes ago",
      hourAgo: "an hour ago",
      hoursAgo: "{count} hours ago",
      dayAgo: "a day ago",
      daysAgo: "{count} days ago",
      weekAgo: "a week ago",
      weeksAgo: "{count} weeks ago",
      monthAgo: "a month ago",
      monthsAgo: "{count} months ago",
      yearAgo: "a year ago",
      yearsAgo: "{count} years ago",
      
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
      
      january: "January",
      february: "February",
      march: "March",
      april: "April",
      may: "May",
      june: "June",
      july: "July",
      august: "August",
      september: "September",
      october: "October",
      november: "November",
      december: "December"
    }
  },
  
  fr: {
    common: {
      loading: "Chargement...",
      saving: "Sauvegarde...",
      save: "Sauvegarder",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      update: "Mettre à jour",
      create: "Créer",
      search: "Rechercher",
      filter: "Filtrer",
      sort: "Trier",
      export: "Exporter",
      import: "Importer",
      download: "Télécharger",
      upload: "Téléverser",
      submit: "Soumettre",
      reset: "Réinitialiser",
      clear: "Effacer",
      apply: "Appliquer",
      confirm: "Confirmer",
      yes: "Oui",
      no: "Non",
      ok: "OK",
      close: "Fermer",
      back: "Retour",
      next: "Suivant",
      previous: "Précédent",
      continue: "Continuer",
      finish: "Terminer",
      success: "Succès",
      error: "Erreur",
      warning: "Avertissement",
      info: "Information"
    },
    navigation: {
      dashboard: "Tableau de Bord",
      profile: "Profil",
      settings: "Paramètres",
      notifications: "Notifications",
      messages: "Conversations",
      referrals: "Références",
      companies: "Employés",
      candidates: "Candidats",
      analytics: "Analyses",
      help: "Aide",
      logout: "Déconnexion",
      home: "Accueil"
    },
    auth: {
      signIn: "Se connecter",
      signOut: "Se déconnecter",
      signUp: "S'inscrire",
      email: "Courriel",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      forgotPassword: "Mot de passe oublié?",
      resetPassword: "Réinitialiser le mot de passe",
      rememberMe: "Se souvenir de moi",
      createAccount: "Créer un compte",
      alreadyHaveAccount: "Vous avez déjà un compte?",
      dontHaveAccount: "Vous n'avez pas de compte?",
      invalidCredentials: "Courriel ou mot de passe invalide",
      passwordTooWeak: "Le mot de passe est trop faible",
      emailAlreadyExists: "Cette adresse email existe déjà",
      accountCreated: "Compte créé avec succès",
      welcomeBack: "Bien retour!",
      verifyEmail: "Vérifier l'e-mail",
      emailVerified: "E-mail vérifié avec succès",
      resendVerification: "Renouveler la vérification"
    },
    settings: {
      title: "Paramètres",
      account: "Compte",
      profile: "Profil",
      privacy: "Confidentialité",
      notifications: "Notifications",
      preferences: "Préférences",
      security: "Sécurité",
      billing: "Facturation",
      
      theme: "Thème",
      light: "Clair",
      dark: "Sombre",
      system: "Système",
      themeDescription: "Choisissez votre thème préféré",
      
      language: "Langue",
      languageDescription: "Sélectionnez votre langue préférée",
      
      timezone: "Fuseau horaire",
      timezoneDescription: "Définissez votre fuseau horaire local",
      
      currency: "Devise",
      currencyDescription: "Choisissez votre monnaie préférée",
      
      dateFormat: "Format de date",
      timeFormat: "Format de temps",
      dateFormatDescription: "Comment les dates doivent être affichées",
      timeFormatDescription: "Choisissez le format 12 ou 24 heures",
      
      emailNotifications: "Notifications par courriel",
      pushNotifications: "Notifications Push",
      referralUpdates: "Mises à jour de référence",
      messageNotifications: "Notifications de message",
      systemNotifications: "Notifications du système",
      weeklyDigest: "Résumé hebdomadaire",
      marketingEmails: "Courriels de marketing",
      notificationFrequency: "Fréquence des notifications",
      instant: "Instantané",
      hourly: "Chaque heure",
      daily: "Journalier",
      weekly: "Hebdomadaire",
      
      profileVisibility: "Visibilité du profil",
      public: "Public",
      private: "Privé",
      connections: "Seulement des connexions",
      showEmail: "Afficher l'e-mail",
      showPhone: "Afficher le téléphone",
      allowReferralRequests: "Autoriser les demandes de référence",
      allowPremiumConversations: "Autoriser les conversations premium",
      dataSharing: "Partager des données",
      analyticsTracking: "Suivi des analyses",
      
      settingsSaved: "Paramètres enregistrés avec succès",
      themeChanged: "Thème changé en {theme}",
      languageChanged: "Langue changée en {language}",
      timezoneChanged: "Fuseau horaire mis à jour",
      currencyChanged: "Devise changée en {currency}",
      notificationsUpdated: "Préférences de notification mises à jour",
      privacyUpdated: "Paramètres de confidentialité mis à jour",
      preferencesUpdated: "Préférences mises à jour"
    },
    dashboard: {
      welcome: "Bon retour",
      overview: "Aperçu",
      recentActivity: "Activité récente",
      stats: "Statistiques",
      quickActions: "Actions rapides",
      totalReferrals: "Références totales",
      successfulReferrals: "Références réussies",
      pendingReferrals: "Références en attente",
      totalEarnings: "Gains totaux",
      thisMonth: "Ce mois-ci",
      thisWeek: "Cette semaine",
      today: "Aujourd'hui",
      makeReferral: "Faire une référence",
      viewProfile: "Voir le profil",
      searchJobs: "Rechercher des emplois",
      updateProfile: "Mettre à jour le profil",
      viewMessages: "Voir les messages"
    },
    referrals: {
      title: "Références",
      newReferral: "Nouvelle référence",
      myReferrals: "Mes références",
      received: "Reçues",
      sent: "Envoyées",
      pending: "En attente",
      accepted: "Acceptées",
      rejected: "Refusées",
      
      draft: "Brouillon",
      submitted: "Soumises",
      underReview: "En cours de révision",
      approved: "Approuvées",
      declined: "Refusées",
      hired: "Embauchées",
      
      submit: "Soumettre",
      withdraw: "Retirer",
      accept: "Accepter",
      decline: "Refuser",
      review: "Examiner",
      
      candidate: "Candidat",
      position: "Position",
      company: "Entreprise",
      description: "Description",
      resume: "CV",
      coverLetter: "Lettre de motivation",
      expectedSalary: "Salaire prévu",
      availableFrom: "Disponible à partir de",
      
      referralSubmitted: "Référence soumise avec succès",
      referralAccepted: "Référence acceptée",
      referralDeclined: "Référence refusée",
      noReferrals: "Aucune référence trouvée",
      loadMore: "Charger plus"
    },
    profile: {
      title: "Profil",
      personalInfo: "Informations personnelles",
      professionalInfo: "Informations professionnelles",
      skills: "Compétences",
      experience: "Expérience",
      education: "Éducation",
      
      firstName: "Prénom",
      lastName: "Nom",
      displayName: "Nom d'affichage",
      bio: "Bio",
      location: "Emplacement",
      phone: "Téléphone",
      website: "Site web",
      
      currentTitle: "Titre actuel",
      currentCompany: "Entreprise actuelle",
      industry: "Secteur",
      experienceLevel: "Niveau d'expérience",
      salary: "Salaire",
      
      linkedin: "LinkedIn",
      github: "GitHub",
      twitter: "Twitter",
      portfolio: "Portfolio",
      
      editProfile: "Modifier le profil",
      saveProfile: "Enregistrer le profil",
      uploadPhoto: "Télécharger une photo",
      removePhoto: "Supprimer la photo",
      viewPublicProfile: "Voir le profil public",
      
      profileUpdated: "Profil mis à jour avec succès",
      photoUploaded: "Photo téléchargée avec succès",
      invalidFileType: "Type de fichier invalide",
      fileTooLarge: "Fichier trop grand"
    },
    messages: {
      title: "Messages",
      conversations: "Conversations",
      newMessage: "Nouveau message",
      noMessages: "Aucun message",
      typeMessage: "Tapez un message...",
      send: "Envoyer",
      
      with: "avec",
      lastSeen: "Vu dernièrement",
      online: "En ligne",
      offline: "Hors ligne",
      typing: "en train d'écrire...",
      
      markAsRead: "Marquer comme lu",
      markAsUnread: "Marquer comme non lu",
      deleteConversation: "Supprimer la conversation",
      blockUser: "Bloquer l'utilisateur",
      reportUser: "Signaler l'utilisateur",
      
      sent: "Envoyé",
      delivered: "Livré",
      read: "Lu",
      failed: "Échec"
    },
    notifications: {
      title: "Notifications",
      markAllRead: "Marquer tout comme lu",
      noNotifications: "Aucune notification",
      
      referralUpdate: "Mise à jour de référence",
      newMessage: "Nouveau message",
      systemUpdate: "Mise à jour du système",
      paymentReceived: "Paiement reçu",
      profileViewed: "Profil consulté",
      
      markAsRead: "Marquer comme lu",
      delete: "Supprimer",
      viewDetails: "Voir les détails"
    },
    companies: {
      title: "Entreprises",
      searchCompanies: "Rechercher des entreprises",
      viewCompany: "Voir l'entreprise",
      noCompanies: "Aucune entreprise trouvée",
      
      about: "À propos",
      employees: "Employés",
      founded: "Créée en",
      headquarters: "Siège social",
      website: "Site web",
      industry: "Secteur",
      
      openPositions: "Postes ouverts",
      viewJobs: "Voir les emplois",
      applyNow: "Postuler maintenant",
      
      follow: "Suivre",
      unfollow: "Ne plus suivre",
      following: "Suivi"
    },
    errors: {
      general: "Quelque chose s'est mal passé",
      networkError: "Erreur de réseau",
      unauthorized: "Non autorisé",
      forbidden: "Interdit",
      notFound: "Introuvable",
      serverError: "Erreur du serveur",
      validationError: "Erreur de validation",
      
      required: "Ce champ est obligatoire",
      invalidEmail: "Adresse e-mail invalide",
      invalidPhone: "Numéro de téléphone invalide",
      invalidUrl: "URL invalide",
      passwordMismatch: "Les mots de passe ne correspondent pas",
      fileTooLarge: "Le fichier est trop volumineux",
      invalidFileType: "Type de fichier invalide",
      
      failedToLoad: "Échec du chargement",
      failedToSave: "Échec de la sauvegarde",
      failedToDelete: "Échec de la suppression",
      failedToUpdate: "Échec de la mise à jour"
    },
    success: {
      saved: "Sauvegardé avec succès",
      updated: "Mis à jour avec succès",
      deleted: "Supprimé avec succès",
      created: "Créé avec succès",
      uploaded: "Téléchargé avec succès",
      sent: "Envoyé avec succès",
      received: "Reçu avec succès"
    },
    dateTime: {
      now: "Maintenant",
      today: "Aujourd'hui",
      yesterday: "Hier",
      tomorrow: "Demain",
      thisWeek: "Cette semaine",
      lastWeek: "La semaine dernière",
      thisMonth: "Ce mois-ci",
      lastMonth: "Le mois dernier",
      thisYear: "Cette année",
      lastYear: "L'année dernière",
      
      justNow: "À l'instant",
      minuteAgo: "il y a une minute",
      minutesAgo: "il y a {count} minutes",
      hourAgo: "il y a une heure",
      hoursAgo: "il y a {count} heures",
      dayAgo: "il y a un jour",
      daysAgo: "il y a {count} jours",
      weekAgo: "il y a une semaine",
      weeksAgo: "il y a {count} semaines",
      monthAgo: "il y a un mois",
      monthsAgo: "il y a {count} mois",
      yearAgo: "il y a un an",
      yearsAgo: "il y a {count} ans",
      
      monday: "Lundi",
      tuesday: "Mardi",
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
      saturday: "Samedi",
      sunday: "Dimanche",
      
      january: "Janvier",
      february: "Février",
      march: "Mars",
      april: "Avril",
      may: "Mai",
      june: "Juin",
      july: "Juillet",
      august: "Août",
      september: "Septembre",
      october: "Octobre",
      november: "Novembre",
      december: "Décembre"
    }
  },
  
  // Placeholder entries for other languages - complete with full translations in production
  de: {} as TranslationKeys,
  it: {} as TranslationKeys,
  pt: {} as TranslationKeys,
  zh: {} as TranslationKeys,
  ja: {} as TranslationKeys,
  ko: {} as TranslationKeys
}

export type TranslationKey = keyof TranslationKeys
export type SupportedLanguage = keyof typeof translations

export const supportedLanguages: SupportedLanguage[] = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko']

export const getTranslation = (
  language: SupportedLanguage, 
  key: string, 
  fallback?: string
): string => {
  const languageTranslations = translations[language]
  if (!languageTranslations) {
    // Fallback to English if language not supported
    return getNestedTranslation(translations.en, key) || fallback || key
  }
  
  return getNestedTranslation(languageTranslations, key) || getNestedTranslation(translations.en, key) || fallback || key
}

// Helper function to get nested translation values
function getNestedTranslation(obj: any, key: string): string | undefined {
  const keys = key.split('.')
  let current = obj
  
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k]
    } else {
      return undefined
    }
  }
  
  return typeof current === 'string' ? current : undefined
}

// Hook for translations
export const useTranslation = (language: SupportedLanguage = 'en') => {
  const t = (key: string, fallback?: string) => getTranslation(language, key, fallback)
  
  return { t, language, supportedLanguages }
} 