// client/src/pages/technicien/MaMessagerie.jsx
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send, Search, MessageSquare, ArrowLeft, MoreVertical,
  Paperclip, Image as ImageIcon, Check, CheckCheck, User
} from 'lucide-react';
import toast from 'react-hot-toast';

import * as messageApi from '../../api/messageApi.js';
import { useAuth } from '../../hooks/useAuth.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Loader from '../../components/common/Loader.jsx';
import { getInitiales, getImageUrl, dateRelative } from '../../utils/helpers.js';

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function TechnicienMaMessagerie() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [conversationActive, setConversationActive] = useState(null);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [recherche, setRecherche] = useState('');
  const [mobileVue, setMobileVue] = useState('liste'); // 'liste' | 'conversation'
  const messagesEndRef = useRef(null);

  // Récupération des conversations
  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
    refetchInterval: 30000
  });

  // Récupération de la conversation active
  const { data: messagesData, isLoading: loadingMessages } = useQuery({
    queryKey: ['conversation', conversationActive?.utilisateur?._id],
    queryFn: () =>
      messageApi.getConversation(conversationActive.utilisateur._id, null, 100),
    enabled: !!conversationActive?.utilisateur?._id,
    refetchInterval: 10000
  });

  // Mutation : envoyer un message
  const envoyerMutation = useMutation({
    mutationFn: ({ destinataire, contenu }) =>
      messageApi.envoyerMessage(destinataire, contenu),
    onSuccess: () => {
      setNouveauMessage('');
      queryClient.invalidateQueries(['conversation', conversationActive?.utilisateur?._id]);
      queryClient.invalidateQueries(['conversations']);
      setTimeout(() => scrollToBottom(), 100);
    },
    onError: (err) => toast.error(err.message)
  });

  // Scroll auto vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messagesData?.messages) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messagesData]);

  const handleEnvoyer = (e) => {
    e.preventDefault();
    if (!nouveauMessage.trim()) return;
    if (!conversationActive?.utilisateur?._id) return;

    envoyerMutation.mutate({
      destinataire: conversationActive.utilisateur._id,
      contenu: nouveauMessage.trim()
    });
  };

  const handleSelectionnerConversation = (conv) => {
    setConversationActive(conv);
    setMobileVue('conversation');
  };

  const conversations = (conversationsData?.conversations || []).filter((c) => {
    if (!recherche) return true;
    const q = recherche.toLowerCase();
    const u = c.utilisateur || {};
    return (
      u.nom?.toLowerCase().includes(q) ||
      u.prenom?.toLowerCase().includes(q) ||
      c.dernierMessage?.contenu?.toLowerCase().includes(q)
    );
  });

  const messages = messagesData?.messages || [];

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-full">
        {/* ===== COLONNE GAUCHE : LISTE ===== */}
        <Card
          padding="none"
          className={`flex flex-col overflow-hidden ${
            mobileVue === 'conversation' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">
              Messagerie
            </h2>
            <Input
              placeholder="Rechercher..."
              icon={Search}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="!py-2"
            />
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4">
                <Loader size="sm" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                <p className="text-sm text-neutral-500">
                  Aucune conversation
                </p>
                <p className="text-xs text-neutral-400 mt-1">
                  Vos échanges apparaîtront ici
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const u = conv.utilisateur || {};
                const dernier = conv.dernierMessage || {};
                const estActif = conversationActive?.utilisateur?._id === u._id;

                return (
                  <button
                    key={u._id}
                    onClick={() => handleSelectionnerConversation(conv)}
                    className={`
                      w-full p-3 flex items-start gap-3 border-b border-neutral-100
                      text-left transition-colors
                      ${estActif ? 'bg-primary-50' : 'hover:bg-neutral-50'}
                    `}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {u.photo ? (
                        <img src={getImageUrl(u.photo)} alt={u.nom} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary-700 font-semibold text-sm">
                          {getInitiales(u)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="font-medium text-sm text-neutral-900 truncate">
                          {u.prenom} {u.nom}
                        </p>
                        <span className="text-xs text-neutral-400 flex-shrink-0">
                          {dernier.createdAt ? dateRelative(dernier.createdAt) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {dernier.contenu || 'Nouvelle conversation'}
                      </p>
                    </div>

                    {conv.nonLus > 0 && (
                      <span className="bg-primary-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0">
                        {conv.nonLus > 9 ? '9+' : conv.nonLus}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* ===== COLONNE DROITE : CONVERSATION ===== */}
        <Card
          padding="none"
          className={`flex flex-col overflow-hidden ${
            mobileVue === 'liste' ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!conversationActive ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
                <p className="text-neutral-500 font-medium">
                  Sélectionnez une conversation
                </p>
                <p className="text-sm text-neutral-400 mt-1">
                  Choisissez un contact à gauche pour commencer
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header conversation */}
              <div className="p-4 border-b border-neutral-200 flex items-center gap-3">
                <button
                  onClick={() => setMobileVue('liste')}
                  className="md:hidden p-1.5 rounded-lg hover:bg-neutral-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {conversationActive.utilisateur?.photo ? (
                    <img
                      src={getImageUrl(conversationActive.utilisateur.photo)}
                      alt={conversationActive.utilisateur.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-primary-700 font-semibold text-sm">
                      {getInitiales(conversationActive.utilisateur)}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 truncate">
                    {conversationActive.utilisateur?.prenom}{' '}
                    {conversationActive.utilisateur?.nom}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {conversationActive.utilisateur?.role}
                  </p>
                </div>

                <button className="p-2 rounded-lg hover:bg-neutral-100">
                  <MoreVertical className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                {loadingMessages ? (
                  <Loader size="sm" />
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-neutral-400">
                      Aucun message. Commencez la conversation !
                    </p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const estMoi = msg.expediteur?._id === user?._id ||
                      msg.expediteur === user?._id;
                    const expediteur = estMoi ? user : conversationActive.utilisateur;

                    return (
                      <div
                        key={msg._id || i}
                        className={`flex gap-2 ${estMoi ? 'justify-end' : 'justify-start'}`}
                      >
                        {!estMoi && (
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {expediteur?.photo ? (
                              <img
                                src={getImageUrl(expediteur.photo)}
                                alt={expediteur.nom}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-primary-700 font-semibold text-xs">
                                {getInitiales(expediteur)}
                              </span>
                            )}
                          </div>
                        )}

                        <div className={`max-w-[70%] ${estMoi ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`
                              px-4 py-2.5 rounded-2xl text-sm
                              ${estMoi
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-md'
                              }
                            `}
                          >
                            {msg.contenu}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 text-xs text-neutral-400 ${
                            estMoi ? 'justify-end' : ''
                          }`}>
                            <span>{dateRelative(msg.createdAt)}</span>
                            {estMoi && (
                              msg.lu ? (
                                <CheckCheck className="w-3 h-3 text-primary-500" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleEnvoyer} className="p-3 border-t border-neutral-200 bg-white">
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    className="p-2.5 rounded-lg hover:bg-neutral-100 text-neutral-500"
                    title="Joindre un fichier"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={nouveauMessage}
                    onChange={(e) => setNouveauMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 px-4 py-2.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />

                  <button
                    type="submit"
                    disabled={!nouveauMessage.trim() || envoyerMutation.isLoading}
                    className="p-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}