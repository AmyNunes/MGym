// Ponto de entrada do app.
import 'expo-router/entry';

import { defineNotificationTask } from './src/notifications/backgroundTask';

// A tarefa do "Mais tarde" precisa existir no carregamento: o Android pode abrir só ela,
// com o app fechado (lição do Meu Inglês).
defineNotificationTask();
