// client/src/pages/public/TestUI.jsx
import { useState } from 'react';
import Button from '../../components/common/Button.jsx';
import Input from '../../components/common/Input.jsx';
import Card from '../../components/common/Card.jsx';
import Badge from '../../components/common/Badge.jsx';
import Modal from '../../components/common/Modal.jsx';
import Pagination from '../../components/common/Pagination.jsx';
import { Plus, Search, Check, AlertCircle } from 'lucide-react';

export default function TestUI() {
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [texte, setTexte] = useState('');

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container-app space-y-8">
        <Card>
          <h2 className="text-xl font-bold mb-4">Boutons</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success" icon={Check}>Success</Button>
            <Button variant="danger" icon={AlertCircle}>Danger</Button>
            <Button variant="outline">Outline</Button>
            <Button loading>Chargement</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Inputs</h2>
          <div className="space-y-4">
            <Input
              label="Nom complet"
              placeholder="Jean Dupont"
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              required
            />
            <Input
              label="Recherche"
              placeholder="Rechercher..."
              icon={Search}
            />
            <Input
              label="Email"
              placeholder="email@example.com"
              error="Cet email est invalide"
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge color="primary">Nouveau</Badge>
            <Badge color="success">Certifié</Badge>
            <Badge color="warning">En attente</Badge>
            <Badge color="danger">Suspendu</Badge>
            <Badge color="info">Info</Badge>
            <Badge color="neutral">Neutre</Badge>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Modal</h2>
          <Button onClick={() => setModalOpen(true)} icon={Plus}>
            Ouvrir la modale
          </Button>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Exemple de modale"
            footer={
              <>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Annuler
                </Button>
                <Button onClick={() => setModalOpen(false)}>Confirmer</Button>
              </>
            }
          >
            <p>Ceci est le contenu de la modale.</p>
          </Modal>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Pagination</h2>
          <Pagination
            page={page}
            totalPages={10}
            total={200}
            limit={20}
            onPageChange={setPage}
          />
        </Card>
      </div>
    </div>
  );
}