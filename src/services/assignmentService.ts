// CLIENT-SIDE STORAGE for Assignments

export type AssignmentInput = {
  classId?: string | null;
  studentId?: string | null;
  pathId: string;
  dueAt?: number | null;
};

export interface Assignment extends AssignmentInput {
  id: string;
  createdAt: number;
}

const STORAGE_KEY = 'eai_assignments_v1';

export const createAssignment = async (payload: AssignmentInput): Promise<{ assignment: Assignment }> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const currentStr = localStorage.getItem(STORAGE_KEY);
  let current: Assignment[] = [];
  try {
    current = currentStr ? JSON.parse(currentStr) : [];
  } catch {
    current = [];
  }
  
  const newAssignment: Assignment = { 
    id: `local-assign-${Date.now()}`, 
    ...payload, 
    createdAt: Date.now() 
  };
  
  const updated = [newAssignment, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return { assignment: newAssignment };
};

export const listAssignments = async (params: { classId?: string; studentId?: string } = {}): Promise<{ assignments: Assignment[] }> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const currentStr = localStorage.getItem(STORAGE_KEY);
  let assignments: Assignment[] = [];
  try {
    assignments = currentStr ? JSON.parse(currentStr) : [];
  } catch {
    assignments = [];
  }
  
  if (params.classId) {
    assignments = assignments.filter(a => a.classId === params.classId);
  }
  if (params.studentId) {
    assignments = assignments.filter(a => a.studentId === params.studentId);
  }
  
  return { assignments };
};
