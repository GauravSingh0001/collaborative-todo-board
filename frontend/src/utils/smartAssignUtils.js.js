// src/utils/smartAssignUtils.js
export const calculateUserWorkload = (tasks, userId) => {
  return tasks.filter(task => 
    task.assignedUser && 
    task.assignedUser.id === userId && 
    ['Todo', 'In Progress'].includes(task.status)
  ).length;
};

export const findOptimalUser = (tasks, users) => {
  if (!users || users.length === 0) return null;

  const userWorkloads = users.map(user => ({
    user,
    workload: calculateUserWorkload(tasks, user.id)
  }));

  return userWorkloads.reduce((optimal, current) => 
    current.workload < optimal.workload ? current : optimal
  ).user;
};

export const getWorkloadDistribution = (tasks, users) => {
  return users.map(user => ({
    user,
    workload: calculateUserWorkload(tasks, user.id),
    tasks: tasks.filter(task => 
      task.assignedUser && 
      task.assignedUser.id === user.id
    )
  }));
};