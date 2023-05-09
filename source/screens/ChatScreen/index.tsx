import React, {useState, useCallback, useEffect, useContext} from 'react';
import {
  Actions,
  ActionsProps,
  GiftedChat,
  IMessage,
} from 'react-native-gifted-chat';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppContext} from '../../providers/AppProvider';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import useTheme from '../../hooks/useTheme';
import IconComponent from '../../components/IconComponent/IconComponent';
import {IChat} from '../../hooks/useChats';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../../navigation/DefaultStackNavigator';
import Avatar from '../../components/Avatar';

export function ChatScreen({
  route,
}: {
  route: {
    params: {
      chatId: string;
      users: number[];
      chatData: {name: string; avatar: string; type: 'GROUP' | 'PERSONAL'};
    };
  };
}) {
  const {users: usersIds, chatId, chatData} = route.params || {};
  const [messages, setMessages] = useState<IMessage[]>([]);

  const context = useContext(AppContext);
  const {setChatMessages, messages: contextMessages} = context.messages;
  const chatMessages = contextMessages[chatId];

  const users = context.users.users.filter(item =>
    usersIds?.includes(item._id),
  );

  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      setMessages(chatMessages || []);
    }, []),
  );

  const onSend = useCallback(
    (messages: IMessage[] = [], noAnswer: boolean = true) => {
      const newMessage = messages[0];
      const answers = noAnswer
        ? [
            ...users.map(user => ({
              _id: new Date().getTime() + Math.floor(Math.random() * 100000),
              text: `${newMessage.text}❤`,
              createdAt: new Date(),
              user,
            })),
            ...messages,
          ]
        : [...messages];

      setMessages((previousMessages: IMessage[]) => {
        setChatMessages([...previousMessages, ...answers], chatId);

        return GiftedChat.append(previousMessages, [...answers]);
      });
    },
    [],
  );

  const handleChoosePhoto = () => {
    launchImageLibrary({mediaType: 'photo'}, ({didCancel, assets}) => {
      if (!assets?.[0]) return;

      const message = {
        _id: new Date().getTime() + Math.floor(Math.random() * 100000),
        text: '',
        createdAt: new Date(),
        user: {
          _id: 999,
        },
        image: assets[0].uri,
      };
      onSend([message], false);
    });
  };

  function renderActions(props: Readonly<ActionsProps>) {
    return (
      <Actions
        {...props}
        options={{
          ['Send Image']: handleChoosePhoto,
          ['Cancel']: () => {},
        }}
        icon={() => (
          <IconComponent
            iconSet="Entypo"
            name={'attachment'}
            size={theme.iconSize.m}
          />
        )}
        onSend={args => console.log(args)}
      />
    );
  }

  return (
    <View style={{flex: 1, paddingBottom: theme.insets.bottom}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: theme.colors.DEFAULT_LIGHT,
          paddingBottom: theme.space.xs,
          paddingTop: theme.space.xs + theme.insets.top,
          ...theme.defaultShadow,
        }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <IconComponent
            style={{marginRight: theme.space.l}}
            name="chevron-back"
            iconSet="Ionicons"
            size={theme.iconSize.l}
          />
        </TouchableOpacity>
        <Avatar
          avatar={chatData.avatar}
          disabled={chatData.type === 'GROUP'}
          onPress={() => {
            navigation.navigate('UserScreen', {
              user: users[0],
            });
          }}></Avatar>
        <Text style={{fontSize: theme.fontSizes.large}}>{chatData.name}</Text>
      </View>
      <GiftedChat
        renderUsernameOnMessage
        renderActions={renderActions}
        messages={messages}
        onSend={messages => onSend(messages)}
        onPressAvatar={user => {
          const {name, _id, avatar} = user;

          navigation.navigate('UserScreen', {
            user: {name: `${name}`, _id: Number(_id), avatar: `${avatar}`},
          });
        }}
        user={{
          _id: 999,
        }}
      />
    </View>
  );
}
