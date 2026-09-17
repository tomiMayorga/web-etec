import { Router } from 'express';
import { consultarChatbot, obtenerChatbot } from '../controllers/chatbot.controller';
import { limiteChatbot } from '../security/request-protection';

export const chatbotRouter = Router();

chatbotRouter.get('/', obtenerChatbot);
chatbotRouter.post('/consulta', limiteChatbot, consultarChatbot);
