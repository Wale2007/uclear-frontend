/**
 * Mock Student & Staff Database
 * Contains 150+ diverse Nigerian students and 120+ academic & non-academic staff.
 * Password for all accounts: "password123"
 */

const departments = [
  { dept: 'Software Engineering', faculty: 'Computing', code: 'SEN' },
  { dept: 'Computer Science', faculty: 'Computing', code: 'CSC' },
  { dept: 'Information Technology', faculty: 'Computing', code: 'IFT' },
  { dept: 'Cyber Security', faculty: 'Computing', code: 'CYS' },
  { dept: 'Electrical & Electronics Engineering', faculty: 'Engineering', code: 'EEE' },
  { dept: 'Mechanical Engineering', faculty: 'Engineering', code: 'MEE' },
  { dept: 'Civil & Environmental Engineering', faculty: 'Engineering', code: 'CVE' },
  { dept: 'Chemical Engineering', faculty: 'Engineering', code: 'CHE' },
  { dept: 'Metallurgical & Materials Engineering', faculty: 'Engineering', code: 'MTE' },
  { dept: 'Mining Engineering', faculty: 'Engineering', code: 'MIN' },
  { dept: 'Petroleum Engineering', faculty: 'Engineering', code: 'PET' },
  { dept: 'Agricultural & Environmental Engineering', faculty: 'Engineering', code: 'AGE' },
  { dept: 'Industrial & Production Engineering', faculty: 'Engineering', code: 'IPE' },
  { dept: 'Biochemistry', faculty: 'Science', code: 'BCH' },
  { dept: 'Physics', faculty: 'Science', code: 'PHY' },
  { dept: 'Mathematics', faculty: 'Science', code: 'MTH' },
  { dept: 'Chemistry', faculty: 'Science', code: 'CHM' },
  { dept: 'Microbiology', faculty: 'Science', code: 'MCB' },
  { dept: 'Geology', faculty: 'Science', code: 'GEO' },
  { dept: 'Applied Geophysics', faculty: 'Science', code: 'APG' },
  { dept: 'Statistics', faculty: 'Science', code: 'STA' },
  { dept: 'Architecture', faculty: 'Environmental Technology', code: 'ARC' },
  { dept: 'Quantity Surveying', faculty: 'Environmental Technology', code: 'QSV' },
  { dept: 'Building Technology', faculty: 'Environmental Technology', code: 'BLD' },
  { dept: 'Estate Management', faculty: 'Environmental Technology', code: 'ESM' },
  { dept: 'Urban & Regional Planning', faculty: 'Environmental Technology', code: 'URP' },
];

const levels = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level'];

const studentFirstNames = [
  'Olawale', 'Chukwuemeka', 'Fatima', 'Blessing', 'Ibrahim', 'Ngozi', 'Afolabi', 'Mercy',
  'Suleiman', 'Adaeze', 'Tunde', 'Hauwa', 'Emeka', 'Yetunde', 'Chisom', 'Abdulrahman',
  'Oluwakemi', 'Victor', 'Amina', 'Olumide', 'Samuel', 'Grace', 'David', 'Joy', 'Emmanuel',
  'Precious', 'Daniel', 'Faith', 'Michael', 'Esther', 'Joshua', 'Ruth', 'Timothy', 'Deborah',
  'Gabriel', 'Mary', 'Solomon', 'Hannah', 'Paul', 'Miracle', 'Peter', 'Dorcas', 'Joseph',
  'Khadijah', 'Usman', 'Zainab', 'Aliyu', 'Mariam', 'Mustapha', 'Halima', 'Kabir', 'Bilkisu',
  'Ayomide', 'Boluwatife', 'Damilola', 'Eniola', 'Fiyinfoluwa', 'Gbenga', 'Kehinde', 'Taiwo'
];

const studentLastNames = [
  'OLA-SALAWU', 'Nwosu', 'Al-Hassan', 'Okafor', 'Musa', 'Adeleke', 'Adeyemi', 'Eze',
  'Danjuma', 'Onyeka', 'Akinola', 'Bello', 'Obi', 'Bakare', 'Igwe', 'Idris',
  'Adesanya', 'Nzegwu', 'Garba', 'Ogunleye', 'Balogun', 'Oladipo', 'Chukwuma', 'Abubakar',
  'Olawale', 'Ojo', 'Akintola', 'Okeke', 'Lawal', 'Momoh', 'Ajayi', 'Babangida',
  'Bamidele', 'Ekwueme', 'Fashola', 'Gbadamosi', 'Haruna', 'Ige', 'Jubril', 'Kalu',
  'Mustapha', 'Nnamani', 'Ogedengbe', 'Popoola', 'Quadri', 'Raji', 'Sanusi', 'Tijani',
  'Umar', 'Williams', 'Yusuf', 'Zakariya', 'Alabi', 'Adebisi', 'Fadairo', 'Olatunji'
];

function generateStudents() {
  const list = [
    {
      id: 'std-uuid-0001',
      role: 'student',
      name: 'OLA-SALAWU OLAWALE OLUWASEGUN',
      email: 'wola77923@gmail.com',
      phone: '08034567890',
      matricNo: 'SEN/22/9292',
      department: 'Software Engineering',
      faculty: 'Computing',
      level: '300 Level',
      password: 'password123',
    }
  ];

  let count = 1;
  const target = 150;

  for (let i = 0; i < studentFirstNames.length && count < target; i++) {
    for (let j = 0; j < studentLastNames.length && count < target; j++) {
      const first = studentFirstNames[i];
      const last = studentLastNames[j];
      const name = `${last} ${first}`;
      const deptInfo = departments[(i * 7 + j) % departments.length];
      const level = levels[(i + j) % levels.length];
      const year = 20 + ((i + j) % 5);
      const serial = 1000 + ((i * 37 + j * 13) % 8999);
      const matricNo = `${deptInfo.code}/${year}/${serial}`;
      const email = `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z0-9]/g, '')}${serial}@futa.edu.ng`;
      const phone = `080${String((i * 99991 + j * 77773 + serial * 11) % 100000000).padStart(8, '0')}`;

      if (!list.some(s => s.matricNo === matricNo || s.email === email)) {
        list.push({
          id: `std-uuid-${String(count + 1).padStart(4, '0')}`,
          role: 'student',
          name,
          email,
          phone,
          matricNo,
          department: deptInfo.dept,
          faculty: deptInfo.faculty,
          level,
          password: 'password123',
        });
        count++;
      }
    }
  }

  return list;
}

export const MOCK_STUDENTS = generateStudents();

const staffTitles = [
  'Professor', 'Prof.', 'Dr.', 'Dr. (Mrs.)', 'Engr. (Dr.)', 'Associate Prof.',
  'Senior Lecturer', 'Lecturer I', 'Lecturer II', 'Assistant Lecturer'
];

const staffFirstNames = [
  'Sunday', 'Aminu', 'Rachael', 'Benjamin', 'Helen', 'Tunde', 'Sarah', 'Michael',
  'Fatima', 'Adebayo', 'Ngozi', 'Abdul', 'Kemi', 'Victor', 'Amina', 'Olumide',
  'Chidinma', 'Yakubu', 'Nkechi', 'Babatunde', 'Solomon', 'Christopher', 'Folashade',
  'Ikechukwu', 'Korede', 'Mansur', 'Ndidi', 'Olayinka', 'Priscilla', 'Rasheed',
  'Stella', 'Titus', 'Uche', 'Wasiu', 'Yemi', 'Zubairu', 'Adeola', 'Bukola'
];

const staffLastNames = [
  'SALAWU', 'Garba', 'Idowu', 'Okafor', 'Adeyemi', 'Bakare', 'Ibrahim', 'Obi',
  'Umar', 'Ogunleye', 'Igwe', 'Idris', 'Adesanya', 'Nzegwu', 'Sani', 'Tobi',
  'Eze', 'Danjuma', 'Onyeka', 'Akinola', 'Akande', 'Babalola', 'Chukwu', 'Daramola',
  'Falola', 'Giwa', 'Hassan', 'Ikpeba', 'Jegede', 'Kolade', 'Madueke', 'Nwadike',
  'Ogundele', 'Peters', 'Rotimi', 'Soyinka', 'Taiwo', 'Ukpong', 'Williams', 'Yusuf'
];

function generateStaff() {
  const list = [
    {
      id: 'stf-uuid-0001',
      role: 'staff',
      name: 'PROF S.O SALAWU',
      title: 'Professor',
      email: 'sosalawu@futa.edu.ng',
      phone: '08129038475',
      staffId: 'FUTA/STF/CS/1092',
      department: 'Computer Science',
      faculty: 'Computing',
      password: 'password123',
    }
  ];

  let count = 1;
  const target = 120;

  for (let i = 0; i < staffFirstNames.length && count < target; i++) {
    for (let j = 0; j < staffLastNames.length && count < target; j++) {
      const first = staffFirstNames[i];
      const last = staffLastNames[j];
      const title = staffTitles[(i * 3 + j) % staffTitles.length];
      const name = `${title} ${first} ${last}`;
      const deptInfo = departments[(i * 5 + j) % departments.length];
      const serial = 100 + ((i * 29 + j * 17) % 900);
      const staffId = `FUTA/STF/${deptInfo.code}/${serial}`;
      const email = `${first.toLowerCase().charAt(0)}.${last.toLowerCase().replace(/[^a-z0-9]/g, '')}${serial}@futa.edu.ng`;
      const phone = `070${String((i * 88883 + j * 66661 + serial * 17) % 100000000).padStart(8, '0')}`;

      if (!list.some(st => st.staffId === staffId || st.email === email)) {
        list.push({
          id: `stf-uuid-${String(count + 1).padStart(4, '0')}`,
          role: 'staff',
          name,
          title,
          email,
          phone,
          staffId,
          department: deptInfo.dept,
          faculty: deptInfo.faculty,
          password: 'password123',
        });
        count++;
      }
    }
  }

  return list;
}

export const MOCK_STAFF = generateStaff();

export const MOCK_ADMINS = [
  {
    id: 'adm-uuid-0001',
    role: 'admin',
    name: 'SUG Executive Admin',
    email: 'sug.admin@futa.edu.ng',
    roleType: 'SUG_ADMIN',
    departmentUnit: 'Student Union',
    password: 'password123',
  },
  {
    id: 'adm-uuid-0002',
    role: 'admin',
    name: 'Faculty of Computing Admin',
    email: 'computing.admin@futa.edu.ng',
    roleType: 'FACULTY_ADMIN',
    departmentUnit: 'Deanery',
    password: 'password123',
  },
  {
    id: 'adm-uuid-0003',
    role: 'admin',
    name: 'Software Eng. Dept Admin',
    email: 'sen.admin@futa.edu.ng',
    roleType: 'DEPARTMENT_ADMIN',
    departmentUnit: 'Software Engineering',
    password: 'password123',
  },
  {
    id: 'adm-uuid-0004',
    role: 'admin',
    name: 'University Bursar Admin',
    email: 'bursar.admin@futa.edu.ng',
    roleType: 'BURSAR',
    departmentUnit: 'Bursary',
    password: 'password123',
  },
];

export const MOCK_DUES = [
  {
    id: 'dues-std-001',
    name: 'Student Union Government (SUG) Dues',
    amount: 2000,
    category: 'Student Union',
    description: 'Annual SUG developmental levy, welfare, and membership fee covering all student activities.',
    deadline: '2026-08-31',
    roleTarget: 'student',
    isActive: true,
  },
  {
    id: 'dues-std-002',
    name: 'Faculty Developmental Levy',
    amount: 3500,
    category: 'Faculty',
    description: 'Faculty-level operational fees, computing laboratory maintenance, and annual seminar series.',
    deadline: '2026-09-15',
    roleTarget: 'student',
    isActive: true,
  },
  {
    id: 'dues-std-003',
    name: 'Departmental Dues',
    amount: 5000,
    category: 'Departmental',
    description: 'Software Engineering Department laboratory maintenance and final year project seed fund.',
    deadline: '2026-06-25',
    roleTarget: 'student',
    isActive: true,
  },
  {
    id: 'dues-std-004',
    name: 'Library Clearance & E-Resource Fee',
    amount: 1500,
    category: 'Other',
    description: 'Central library digital resources access and annual clearance administration.',
    deadline: '2026-09-30',
    roleTarget: 'student',
    isActive: true,
  },
  {
    id: 'dues-std-005',
    name: 'Sports & Recreation Levy',
    amount: 1000,
    category: 'Other',
    description: 'Annual sports complex access, athletic equipment maintenance, and inter-faculty games.',
    deadline: '2026-10-15',
    roleTarget: 'student',
    isActive: true,
  },
  {
    id: 'dues-std-006',
    name: 'Medical / Health Insurance Levy',
    amount: 2500,
    category: 'Health',
    description: 'Student Health Centre operational levy, NHIS subsidized medicines, and clinic clearance.',
    deadline: '2026-07-01',
    roleTarget: 'student',
    isActive: true,
  },
  {
    id: 'dues-stf-001',
    name: 'ASUU Union Monthly Dues',
    amount: 2000,
    category: 'Staff Union',
    description: 'Academic Staff Union of Universities standard membership and welfare levy.',
    deadline: '2026-08-31',
    roleTarget: 'staff',
    isActive: true,
  },
  {
    id: 'dues-stf-002',
    name: 'Staff Welfare & Cooperative Fund',
    amount: 5000,
    category: 'Welfare',
    description: 'Staff cooperative fund, mutual benefits scheme, and quarterly welfare dividend contribution.',
    deadline: '2026-09-15',
    roleTarget: 'staff',
    isActive: true,
  },
  {
    id: 'dues-stf-003',
    name: 'Staff Club Annual Membership',
    amount: 10000,
    category: 'Club',
    description: 'Annual membership and facility maintenance fee for the FUTA Senior Staff Club.',
    deadline: '2026-06-30',
    roleTarget: 'staff',
    isActive: true,
  },
  {
    id: 'dues-stf-004',
    name: 'NASU Non-Academic Staff Levy',
    amount: 1500,
    category: 'Staff Union',
    description: 'Non-Academic Staff Union monthly operational levy and emergency relief fund.',
    deadline: '2026-10-01',
    roleTarget: 'staff',
    isActive: true,
  },
];

export function authenticateMockUser(credential, password, role) {
  const cred = credential.trim().toLowerCase();
  const pass = password;

  let pool = [];
  if (role === 'student') pool = MOCK_STUDENTS;
  else if (role === 'staff') pool = MOCK_STAFF;
  else if (role === 'admin') pool = MOCK_ADMINS;

  const found = pool.find((u) => {
    const matchEmail = u.email && u.email.toLowerCase() === cred;
    const matchMatric = u.matricNo && u.matricNo.toLowerCase() === cred;
    const matchStaffId = u.staffId && u.staffId.toLowerCase() === cred;
    return matchEmail || matchMatric || matchStaffId;
  });

  if (!found) {
    return { success: false, error: `No ${role} account found matching "${credential}"` };
  }

  if (found.password !== pass && pass !== 'password123') {
    return { success: false, error: 'Incorrect password. (Default prototype password: password123)' };
  }

  const { password: _, ...safeUser } = found;
  return {
    success: true,
    token: `mock-jwt-${safeUser.id}-${Date.now()}`,
    user: safeUser,
  };
}
