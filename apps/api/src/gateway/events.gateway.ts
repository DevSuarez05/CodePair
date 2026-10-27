import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: (_origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir conexiones desde cualquier origen en desarrollo (localhost:3000, etc.)
      callback(null, true);
    },
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('⚡ Socket.IO WebSocket Gateway inicializado con éxito');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Cliente desconectado: ${client.id}`);
  }

  // ─── Canales del Feed Global ───────────────────────────────────

  @SubscribeMessage('join_feed')
  handleJoinFeed(@ConnectedSocket() client: Socket) {
    void client.join('feed_room');
    this.logger.debug(`Cliente ${client.id} se unió a 'feed_room'`);
    return { status: 'joined_feed' };
  }

  @SubscribeMessage('leave_feed')
  handleLeaveFeed(@ConnectedSocket() client: Socket) {
    void client.leave('feed_room');
    return { status: 'left_feed' };
  }

  // ─── Canales de Sesión de Pair Programming ─────────────────────

  @SubscribeMessage('join_session')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; user?: { id: string; name: string } },
  ) {
    if (!payload?.sessionId) return { error: 'sessionId is required' };

    const room = `session_${payload.sessionId}`;
    void client.join(room);
    this.logger.log(
      `Usuario ${payload.user?.name || client.id} se unió a la sala en vivo ${room}`,
    );

    // Notificar al otro participante que se ha conectado su compañero
    client.to(room).emit('peer_joined', {
      user: payload.user || { id: client.id, name: 'Compañero' },
      timestamp: new Date().toISOString(),
    });

    return { status: 'joined', room };
  }

  @SubscribeMessage('leave_session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; user?: { id: string; name: string } },
  ) {
    if (!payload?.sessionId) return;
    const room = `session_${payload.sessionId}`;
    void client.leave(room);

    client.to(room).emit('peer_left', {
      user: payload.user || { id: client.id },
      timestamp: new Date().toISOString(),
    });

    return { status: 'left' };
  }

  @SubscribeMessage('code_change')
  handleCodeChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; code: string },
  ) {
    if (!payload?.sessionId) return;
    const room = `session_${payload.sessionId}`;
    // Difundir cambios de código al otro participante en la sala
    client.to(room).emit('code_updated', {
      code: payload.code,
      senderId: client.id,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Emisores invocados desde los Servicios de Negocio ─────────

  /**
   * Notifica a todos los clientes del Feed cuando un estudiante crea una nueva solicitud.
   */
  notifyNewHelpRequest(request: unknown) {
    if (!this.server) return;
    this.logger.log(`Difundiendo nueva solicitud al feed: ${(request as any)?.id}`);
    this.server.to('feed_room').emit('new_help_request', request);
    this.server.emit('new_help_request', request); // Difundir también a nivel global
  }

  /**
   * Notifica cuando un mentor acepta una solicitud de ayuda y se genera la sesión.
   */
  notifyRequestAccepted(requestId: string, session: unknown) {
    if (!this.server) return;
    this.logger.log(`Difundiendo aceptación de solicitud ${requestId} con sesión`);
    this.server.emit('request_status_updated', {
      requestId,
      status: 'IN_PROGRESS',
      session,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notifica cuando una sesión concluye y se cierra.
   */
  notifySessionCompleted(sessionId: string) {
    if (!this.server) return;
    const room = `session_${sessionId}`;
    this.logger.log(`Difundiendo conclusión de sesión en ${room}`);
    this.server.to(room).emit('session_completed', {
      sessionId,
      timestamp: new Date().toISOString(),
    });
  }
}
