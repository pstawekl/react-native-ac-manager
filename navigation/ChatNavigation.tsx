import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import ChatScreen from '../screens/Chat/ChatScreen';
import ClientSelectorScreen from '../screens/Chat/ClientSelector';
import ConversationsListScreen from '../screens/Chat/ConversationsList';
import { ChatParamList } from './types';

const Chat = createStackNavigator<ChatParamList>();

function ChatNavigation() {
  return (
    <Chat.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Chat.Screen
        name="ConversationsList"
        component={ConversationsListScreen}
      />
      <Chat.Screen name="ChatScreen" component={ChatScreen} />
      <Chat.Screen name="ClientSelector" component={ClientSelectorScreen} />
    </Chat.Navigator>
  );
}

export default ChatNavigation;
