import type { GameDto, PaymentDto } from '@itch/protocol';
import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabsParamList = {
  Home: undefined;
  Creators: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Tabs: NavigatorScreenParams<TabsParamList>;
  Payments: undefined;
  Games: undefined;
  PaymentDetail: { payment: PaymentDto };
  GameDetail: { game: GameDto };
  Creator: { userId: string };
};
