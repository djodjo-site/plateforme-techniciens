// client/src/pages/technicien/MonNINTI.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Award, CheckCircle, AlertTriangle, Clock, RefreshCw, Download,
  Copy, ExternalLink, Shield, XCircle, QrCode, Calendar, MapPin
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

import * as technicienApi from '../../api/technicienApi.js';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Button from '../../components/common/Button.jsx';
import Loader from '../../components/common/Loader.jsx';
import { NINTI_CONFIG } from '../../utils/constants.js';
import { formatDate, formatMontant } from '../../utils/helpers.js';

// ============================================================
// CARTE NINTI (visuel principal)
// ============================================================
function CarteNINTI({ ninti, technicien }) {
  const estValide = ninti.statut === 'actif';

  return (
    <div className="relative bg-gradient-to-br from-primary-900 via-primary-700 to-primary-600 rounded-2xl p-6 md:p-8 text-white shadow-2xl overflow-hidden">
      {/* Motif décoratif */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />

      <div className="relative">
        {/* En-tête */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-100 uppercase tracking-wider">
                Numéro d'Identification
              </p>
              <p className="font-semibold">Technicien Informatique</p>
            </div>
          </div>
          <Badge
            color={estValide ? 'success' : 'warning'}
            size="lg"
            className="!bg-white/20 !text-white backdrop-blur"
          >
            {estValide ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                ACTIF
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                {ninti.statut.toUpperCase()}
              </>
            )}
          </Badge>
        </div>

        {/* Numéro NINTI */}
        <div className="mb-8">
          <p className="text-xs text-blue-100 uppercase tracking-wider mb-2">
            NINTI
          </p>
          <p className="font-mono text-2xl md:text-4xl font-bold tracking-wider break-all">
            {ninti.numero}
          </p>
        </div>

        {/* Titulaire */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs text-blue-100 uppercase tracking-wider mb-1">
              Titulaire
            </p>
            <p className="font-semibold">
              {technicien?.prenom} {technicien?.nom}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-100 uppercase tracking-wider mb-1">
              Ville
            </p>
            <p className="font-semibold">{technicien?.ville || '—'}</p>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
          <div>
            <p className="text-xs text-blue-100 uppercase tracking-wider mb-1">
              Délivré le
            </p>
            <p className="font-semibold text-sm">
              {formatDate(ninti.dateDelivrance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-blue-100 uppercase tracking-wider mb-1">
              Expire le
            </p>
            <p className="font-semibold text-sm">
              {formatDate(ninti.dateExpiration)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE PRINCIPALE
// ============================================================
export default function TechnicienMonNINTI() {
  const navigate = useNavigate();
  const [qrModal, setQrModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['technicien-ninti'],
    queryFn: technicienApi.getMonNINTI
  });

  const { data: profilData } = useQuery({
    queryKey: ['technicien-profil'],
    queryFn: technicienApi.getProfil
  });

  if (isLoading) {
    return <Loader text="Chargement de votre NINTI..." />;
  }

  const technicien = profilData?.technicien;

  // Cas 1 : Pas de NINTI
  if (!data?.possede) {
    const statut = data?.statut || technicien?.statut;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Mon NINTI
          </h1>
          <p className="text-neutral-500 mt-1">
            Votre numéro d'identification national de technicien
          </p>
        </div>

        <Card>
          <div className="text-center py-10">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Award className="w-10 h-10 text-neutral-400" />
            </div>

            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Aucun NINTI pour le moment
            </h2>

            {statut === 'en_attente_de_test' && (
              <>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  Vous devez d'abord réussir le test de certification pour
                  débloquer votre accréditation.
                </p>
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => navigate('/technicien/test')}
                >
                  Passer le test
                </Button>
              </>
            )}

            {statut === 'test_echoue' && (
              <>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  Vous n'avez pas encore réussi le test. Score minimum requis : {NINTI_CONFIG.PRIX_ACCREDITATION ? '60%' : '60%'}.
                </p>
                <Button
                  variant="warning"
                  size="lg"
                  onClick={() => navigate('/technicien/test')}
                >
                  Repasser le test
                </Button>
              </>
            )}

            {statut === 'test_reussi' && (
              <>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  Félicitations ! Il ne vous reste plus qu'à payer votre accréditation
                  pour recevoir votre NINTI.
                </p>
                <Button
                  variant="success"
                  size="lg"
                  onClick={() => navigate('/technicien/payer-accreditation')}
                >
                  Payer mon accréditation
                </Button>
              </>
            )}

            {statut === 'en_attente_paiement' && (
              <>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  Votre paiement est en attente de confirmation. Finalisez-le
                  pour recevoir votre NINTI.
                </p>
                <Button
                  variant="warning"
                  size="lg"
                  onClick={() => navigate('/technicien/payer-accreditation')}
                >
                  Finaliser le paiement
                </Button>
              </>
            )}

            {statut === 'suspendu' && (
              <>
                <p className="text-neutral-500 mb-6 max-w-md mx-auto">
                  Votre compte est suspendu. Contactez l'administrateur.
                </p>
                <Button variant="outline" onClick={() => navigate('/technicien/dashboard')}>
                  Retour au tableau de bord
                </Button>
              </>
            )}

            {!statut && (
              <Button onClick={() => navigate('/technicien/dashboard')}>
                Retour au tableau de bord
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Cas 2 : Le NINTI existe
  const ninti = data;
  const estValide = ninti.valide;
  const joursRestants = ninti.joursRestants || 0;
  const bientotExpire = joursRestants <= 30 && joursRestants > 0;
  const expire = joursRestants === 0;

  const copierNumero = () => {
    navigator.clipboard.writeText(ninti.numero);
    toast.success('Numéro copié !');
  };

  const urlVerification = ninti.urlVerification ||
    `${window.location.origin}/verifier/${ninti.numero}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
            Mon NINTI
          </h1>
          <p className="text-neutral-500 mt-1">
            Votre numéro d'identification officiel
          </p>
        </div>
        {estValide ? (
          <Badge color="success" size="lg">
            <CheckCircle className="w-4 h-4" />
            Certifié
          </Badge>
        ) : (
          <Badge color="danger" size="lg">
            <XCircle className="w-4 h-4" />
            {expire ? 'Expiré' : ninti.statut}
          </Badge>
        )}
      </div>

      {/* Alerte expiration */}
      {bientotExpire && (
        <Card className="border border-accent-200 bg-accent-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-accent-900">
                Votre NINTI expire bientôt
              </p>
              <p className="text-sm text-accent-700 mt-1">
                Il vous reste <strong>{joursRestants} jour(s)</strong> avant expiration.
                Pensez à le renouveler.
              </p>
            </div>
          </div>
        </Card>
      )}

      {expire && (
        <Card className="border border-danger-200 bg-danger-50">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-danger-900">
                Votre NINTI a expiré
              </p>
              <p className="text-sm text-danger-700 mt-1">
                Renouvelez votre accréditation pour continuer à recevoir des missions.
              </p>
              <Button
                variant="danger"
                size="sm"
                className="mt-3"
                onClick={() => navigate('/technicien/payer-accreditation')}
              >
                Renouveler maintenant
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Carte NINTI */}
      <CarteNINTI ninti={ninti} technicien={technicien} />

      {/* Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button variant="outline" onClick={copierNumero} icon={Copy}>
          Copier
        </Button>

        <Button variant="outline" onClick={() => setQrModal(true)} icon={QrCode}>
          QR Code
        </Button>

        <Link to={`/verifier/${ninti.numero}`} target="_blank">
          <Button variant="outline" fullWidth icon={ExternalLink}>
            Vérifier
          </Button>
        </Link>

        {expire || bientotExpire ? (
          <Button
            variant="warning"
            onClick={() => navigate('/technicien/payer-accreditation')}
            icon={RefreshCw}
          >
            Renouveler
          </Button>
        ) : (
          <Button variant="outline" icon={Download} disabled>
            PDF (bientôt)
          </Button>
        )}
      </div>

      {/* Détails */}
      <Card>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Détails du NINTI
        </h2>

        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Award className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Numéro</p>
              <p className="font-mono font-semibold text-sm break-all">
                {ninti.numero}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              estValide ? 'bg-success-100' : 'bg-danger-100'
            }`}>
              {estValide ? (
                <CheckCircle className="w-4 h-4 text-success-600" />
              ) : (
                <XCircle className="w-4 h-4 text-danger-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-neutral-500">Statut</p>
              <p className="font-semibold text-sm capitalize">
                {ninti.statut}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Date de délivrance</p>
              <p className="font-semibold text-sm">
                {formatDate(ninti.dateDelivrance)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              bientotExpire || expire ? 'bg-accent-100' : 'bg-blue-100'
            }`}>
              <Clock className={`w-4 h-4 ${
                bientotExpire || expire ? 'text-accent-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Date d'expiration</p>
              <p className="font-semibold text-sm">
                {formatDate(ninti.dateExpiration)}
              </p>
              {joursRestants > 0 && (
                <p className="text-xs text-neutral-500">
                  ({joursRestants} jour{joursRestants > 1 ? 's' : ''} restant{joursRestants > 1 ? 's' : ''})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Pays d'émission</p>
              <p className="font-semibold text-sm">{ninti.codePays || 'COD'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-neutral-500">Vérifications</p>
              <p className="font-semibold text-sm">
                {ninti.nombreVerifications || 0} consultation(s)
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Info renouvellements */}
      {ninti.nombreRenouvellements > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-primary-600" />
            Historique des renouvellements
          </h2>
          <p className="text-sm text-neutral-600">
            Vous avez renouvelé votre NINTI <strong>{ninti.nombreRenouvellements} fois</strong>.
          </p>
        </Card>
      )}

      {/* Info vérification */}
      <Card className="bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 text-sm">
              À quoi sert ce numéro ?
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Votre NINTI permet aux clients de vérifier votre certification en ligne.
              Partagez-le sur votre CV, votre carte de visite ou vos réseaux professionnels.
            </p>
            <p className="text-xs text-blue-700 mt-2 font-mono break-all">
              {urlVerification}
            </p>
          </div>
        </div>
      </Card>

      {/* Modal QR Code */}
      {qrModal && (
        <div
          className="fixed inset-0 z-50 bg-neutral-900/70 flex items-center justify-center p-4"
          onClick={() => setQrModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-neutral-900 text-center mb-2">
              QR Code de vérification
            </h3>
            <p className="text-sm text-neutral-500 text-center mb-6">
              Faites scanner ce code pour vérifier l'authenticité
            </p>

            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white border-2 border-neutral-200 rounded-xl">
                <QRCodeSVG
                  value={urlVerification}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
            </div>

            <p className="text-xs font-mono text-center text-neutral-500 mb-6 break-all">
              {ninti.numero}
            </p>

            <Button
              variant="primary"
              fullWidth
              onClick={() => setQrModal(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}