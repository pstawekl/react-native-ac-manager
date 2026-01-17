import { Route, useRoute } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import { SubNavigationStyles } from '../consts/Styles';
import AddTaskForm from '../screens/Tasks/AddTaskForm';
import Filters from '../screens/Tasks/Filters';
import TaskDetails from '../screens/Tasks/TaskDetails';
import TasksMenu from '../screens/Tasks/TasksMenu';
import { TasksParamList } from './types';

function TasksNavigation() {
  const Tasks = createStackNavigator<TasksParamList>();
  const route = useRoute<Route<string, { Menu?: { tab?: string } }>>();

  const initialTabParams = route.params?.Menu?.tab;

  return (
    <Tasks.Navigator
      initialRouteName="Menu"
      screenOptions={SubNavigationStyles}
    >
      <Tasks.Screen
        name="Menu"
        component={TasksMenu}
        initialParams={{ tab: initialTabParams }}
      />
      <Tasks.Screen name="Filter" component={Filters} />
      <Tasks.Screen name="AddForm" component={AddTaskForm} />
      <Tasks.Screen name="TaskDetails" component={TaskDetails} />
    </Tasks.Navigator>
  );
}

export default TasksNavigation;
