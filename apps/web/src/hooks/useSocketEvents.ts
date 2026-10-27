'use client';

import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

export interface UseSocketFeedOptions {
  onNewRequest?: (request: any) => void;
  onRequestStatusUpdated?: (data: { requestId: string; status: string; session?: any }) => void;
}

export function useSocketFeed(options: UseSocketFeedOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => {
      setIsConnected(true);
      socket.emit('join_feed');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join_feed');
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (options.onNewRequest) {
      socket.on('new_help_request', options.onNewRequest);
    }

    if (options.onRequestStatusUpdated) {
      socket.on('request_status_updated', options.onRequestStatusUpdated);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (options.onNewRequest) {
        socket.off('new_help_request', options.onNewRequest);
      }
      if (options.onRequestStatusUpdated) {
        socket.off('request_status_updated', options.onRequestStatusUpdated);
      }
    };
  }, [options.onNewRequest, options.onRequestStatusUpdated]);

  return { isConnected };
}

export function useSocketSession(sessionId: string | null | undefined, currentUser?: { id?: string; name?: string }) {
  const [isPeerConnected, setIsPeerConnected] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();

    socket.emit('join_session', { sessionId, user: currentUser });

    const handlePeerJoined = () => {
      setIsPeerConnected(true);
    };

    const handlePeerLeft = () => {
      setIsPeerConnected(false);
    };

    const handleCompleted = () => {
      setIsCompleted(true);
    };

    socket.on('peer_joined', handlePeerJoined);
    socket.on('peer_left', handlePeerLeft);
    socket.on('session_completed', handleCompleted);

    return () => {
      socket.emit('leave_session', { sessionId, user: currentUser });
      socket.off('peer_joined', handlePeerJoined);
      socket.off('peer_left', handlePeerLeft);
      socket.off('session_completed', handleCompleted);
    };
  }, [sessionId, currentUser]);

  return { isPeerConnected, isCompleted };
}
