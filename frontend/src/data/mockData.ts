export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  faculty: string;
  students: number;
  color: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  time: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  time: string;
}

export interface ClassworkItem {
  id: string;
  title: string;
  type: 'quiz' | 'assignment' | 'project';
  totalMarks: number;
  dueDate: string;
  marks?: number; // Student's marks
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  email: string;
  mobileNo: string;
  profilePicture: string;
  isApproved: boolean;
  joinDate: string;
  parentsName: string;
  address: string;
  result: 'pass' | 'fail' | 'pending';
  feeHistory: FeeRecord[];
}

export interface BannerItem {
  id: string;
  title: string;
  description: string;
  image: string;
  imageUrl?: string; // Add this line for backend compatibility
  link?: string;
}

export interface FeeRecord {
  month: string;
  amount: number;
  status: 'paid' | 'pending';
  paidDate?: string;
}

export interface ClassFee {
  id: string;
  className: string;
  amount: number;
  createdDate: string;
}

export interface TeacherPost {
  id: string;
  subjectId: string;
  title: string;
  content: string;
  teacherName: string;
  date: string;
  time: string;
  comments: Comment[];
}

// Mock data
export const mockSubjects: Subject[] = [
  {
    id: '1',
    name: 'Advanced Mathematics',
    code: 'MATH101',
    description: 'Calculus and Linear Algebra',
    faculty: 'Dr. Sarah Johnson',
    students: 45,
    color: 'bg-blue-500'
  },
  {
    id: '2',
    name: 'Physics Fundamentals',
    code: 'PHY101',
    description: 'Classical Mechanics and Thermodynamics',
    faculty: 'Prof. Michael Brown',
    students: 38,
    color: 'bg-green-500'
  },
  {
    id: '3',
    name: 'Computer Science',
    code: 'CS101',
    description: 'Programming and Data Structures',
    faculty: 'Dr. Emily Davis',
    students: 52,
    color: 'bg-purple-500'
  }
];

export const mockPosts: Post[] = [
  {
    id: '1',
    title: 'Welcome to Advanced Mathematics!',
    content: 'Welcome everyone to our mathematics course. Please review the syllabus and prepare for our first quiz next week.',
    author: 'Dr. Sarah Johnson',
    date: '2024-01-15',
    time: '09:30',
    comments: [
      {
        id: '1',
        author: 'Alex Chen',
        content: 'Thank you for the warm welcome! Looking forward to the course.',
        date: '2024-01-15',
        time: '10:15'
      }
    ]
  },
  {
    id: '2',
    title: 'Assignment 1 Posted',
    content: 'Your first assignment on limits and derivatives is now available. Due date: January 25th.',
    author: 'Dr. Sarah Johnson',
    date: '2024-01-18',
    time: '14:20',
    comments: []
  }
];

export const mockClasswork: ClassworkItem[] = [
  {
    id: '1',
    title: 'Quiz 1: Limits',
    type: 'quiz',
    totalMarks: 10,
    dueDate: '2024-01-20',
    marks: 8
  },
  {
    id: '2',
    title: 'Assignment 1: Derivatives',
    type: 'assignment',
    totalMarks: 50,
    dueDate: '2024-01-25',
    marks: 42
  },
  {
    id: '3',
    title: 'Project: Real World Applications',
    type: 'project',
    totalMarks: 100,
    dueDate: '2024-02-15'
  },
  {
    id: '4',
    title: 'Quiz 2: Continuity',
    type: 'quiz',
    totalMarks: 10,
    dueDate: '2024-02-01',
    marks: 9
  },
  {
    id: '5',
    title: 'Assignment 2: Chain Rule',
    type: 'assignment',
    totalMarks: 40,
    dueDate: '2024-02-05'
  }
];

export const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Alex Chen',
    rollNo: '10A001',
    className: 'Grade 10-A',
    email: 'alex.chen@student.school.edu',
    mobileNo: '+1234567890',
    profilePicture: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face',
    isApproved: true,
    joinDate: '2024-01-10',
    parentsName: 'Michael Chen',
    address: '123 Oak Street, Springfield, IL 62701',
    result: 'pass',
    feeHistory: [
      { month: 'January 2024', amount: 5000, status: 'paid', paidDate: '2024-01-05' },
      { month: 'February 2024', amount: 5000, status: 'paid', paidDate: '2024-02-03' },
      { month: 'March 2024', amount: 5000, status: 'pending' }
    ]
  },
  {
    id: '2',
    name: 'Emma Wilson',
    rollNo: '10A002',
    className: 'Grade 10-A',
    email: 'emma.wilson@student.school.edu',
    mobileNo: '+1234567891',
    profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    isApproved: true,
    joinDate: '2024-01-10',
    parentsName: 'Sarah Wilson',
    address: '456 Maple Avenue, Springfield, IL 62702',
    result: 'pass',
    feeHistory: [
      { month: 'January 2024', amount: 5000, status: 'paid', paidDate: '2024-01-08' },
      { month: 'February 2024', amount: 5000, status: 'paid', paidDate: '2024-02-05' },
      { month: 'March 2024', amount: 5000, status: 'paid', paidDate: '2024-03-02' }
    ]
  },
  {
    id: '3',
    name: 'James Rodriguez',
    rollNo: '10A003',
    className: 'Grade 10-A',
    email: 'james.rodriguez@student.school.edu',
    mobileNo: '+1234567892',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isApproved: false,
    joinDate: '2024-01-12',
    parentsName: 'Carlos Rodriguez',
    address: '789 Pine Road, Springfield, IL 62703',
    result: 'pending',
    feeHistory: [
      { month: 'January 2024', amount: 5000, status: 'pending' },
      { month: 'February 2024', amount: 5000, status: 'pending' },
      { month: 'March 2024', amount: 5000, status: 'pending' }
    ]
  },
  {
    id: '4',
    name: 'Sophie Kumar',
    rollNo: '10B001',
    className: 'Grade 10-B',
    email: 'sophie.kumar@student.school.edu',
    mobileNo: '+1234567893',
    profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    isApproved: true,
    joinDate: '2024-01-10',
    parentsName: 'Raj Kumar',
    address: '321 Cedar Lane, Springfield, IL 62704',
    result: 'fail',
    feeHistory: [
      { month: 'January 2024', amount: 5000, status: 'paid', paidDate: '2024-01-07' },
      { month: 'February 2024', amount: 5000, status: 'paid', paidDate: '2024-02-04' },
      { month: 'March 2024', amount: 5000, status: 'pending' }
    ]
  },
  {
    id: '5',
    name: 'Marcus Thompson',
    rollNo: '11A001',
    className: 'Grade 11-A',
    email: 'marcus.thompson@student.school.edu',
    mobileNo: '+1234567894',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isApproved: true,
    joinDate: '2024-01-10',
    parentsName: 'David Thompson',
    address: '654 Birch Street, Springfield, IL 62705',
    result: 'pass',
    feeHistory: [
      { month: 'January 2024', amount: 5500, status: 'paid', paidDate: '2024-01-06' },
      { month: 'February 2024', amount: 5500, status: 'paid', paidDate: '2024-02-02' },
      { month: 'March 2024', amount: 5500, status: 'paid', paidDate: '2024-03-01' }
    ]
  }
];

export const mockBanners: BannerItem[] = [
  {
    id: '1',
    title: 'Science Fair 2024',
    description: 'Join us for the annual science fair. Showcase your innovative projects!',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=300&fit=crop'
  },
  {
    id: '2',
    title: 'Winter Break Notice',
    description: 'School will be closed from Dec 20 - Jan 3. Happy holidays!',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=300&fit=crop'
  },
  {
    id: '3',
    title: 'New Library Hours',
    description: 'Library is now open until 9 PM on weekdays.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=300&fit=crop'
  }
];

export const mockClassFees: ClassFee[] = [
  {
    id: '1',
    className: 'Grade 10-A',
    amount: 5000,
    createdDate: '2024-01-01'
  },
  {
    id: '2',
    className: 'Grade 10-B',
    amount: 5000,
    createdDate: '2024-01-01'
  },
  {
    id: '3',
    className: 'Grade 11-A',
    amount: 5500,
    createdDate: '2024-01-01'
  },
  {
    id: '4',
    className: 'Grade 11-B',
    amount: 5500,
    createdDate: '2024-01-01'
  }
];

export const mockTeacherPosts: TeacherPost[] = [
  {
    id: '1',
    subjectId: '1',
    title: 'Welcome to Advanced Mathematics!',
    content: 'Welcome everyone to our mathematics course. Please review the syllabus and prepare for our first quiz next week.',
    teacherName: 'Dr. Sarah Johnson',
    date: '2024-01-15',
    time: '09:30',
    comments: [
      {
        id: '1',
        author: 'Alex Chen',
        content: 'Thank you for the warm welcome! Looking forward to the course.',
        date: '2024-01-15',
        time: '10:15'
      },
      {
        id: '2',
        author: 'Emma Wilson',
        content: 'When will the syllabus be available?',
        date: '2024-01-15',
        time: '11:20'
      }
    ]
  },
  {
    id: '2',
    subjectId: '2',
    title: 'Physics Lab Safety Guidelines',
    content: 'Please read through the lab safety guidelines before our next practical session.',
    teacherName: 'Prof. Michael Brown',
    date: '2024-01-16',
    time: '14:30',
    comments: [
      {
        id: '3',
        author: 'James Rodriguez',
        content: 'Are safety goggles provided by the school?',
        date: '2024-01-16',
        time: '15:45'
      }
    ]
  },
  {
    id: '3',
    subjectId: '3',
    title: 'Programming Assignment 1',
    content: 'Your first programming assignment is now available. Implement a simple calculator using Python.',
    teacherName: 'Dr. Emily Davis',
    date: '2024-01-18',
    time: '11:15',
    comments: [
      {
        id: '4',
        author: 'Sophie Kumar',
        content: 'What libraries are we allowed to use?',
        date: '2024-01-18',
        time: '12:30'
      },
      {
        id: '5',
        author: 'Marcus Thompson',
        content: 'Can we submit the assignment in groups?',
        date: '2024-01-18',
        time: '13:15'
      }
    ]
  }
];