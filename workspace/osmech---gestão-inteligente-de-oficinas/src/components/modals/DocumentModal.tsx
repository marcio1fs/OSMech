import React, { useState } from 'react';
import { FileText, Download, Eye, Image as ImageIcon, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { convertFileToBase64 } from '../../utils/helpers';

export interface Document {
  id: string;
  name: string;
  type: string;
  data: string;
  uploadedAt: string;
}

interface DocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: Document[];
  onAddDocument: (doc: Omit<Document, 'id' | 'uploadedAt'>) => void;
  onRemoveDocument: (id: string) => void;
  isLoading?: boolean;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  isOpen,
  onClose,
  documents,
  onAddDocument,
  onRemoveDocument,
  isLoading = false,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await convertFileToBase64(file);
      onAddDocument({
        name: file.name,
        type: file.type,
        data,
      });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = (doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.data;
    link.download = doc.name;
    link.click();
  };

  const isImage = (type: string) => type.startsWith('image/');

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Documentos Anexos" 
      titleIcon={<FileText className="text-blue-600" size={20} />}
      size="lg"
    >
      <div className="p-6">
        {/* Upload */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Adicionar Documento
          </label>
          <div className="flex gap-3">
            <Input
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              onChange={handleFileUpload}
              disabled={uploading || isLoading}
              className="flex-1"
            />
          </div>
          {uploading && (
            <p className="text-xs text-blue-600 mt-2">Enviando arquivo...</p>
          )}
        </div>

        {/* Lista de documentos */}
        <div className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum documento anexado</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
              >
                {isImage(doc.type) ? (
                  <ImageIcon size={24} className="text-blue-500" />
                ) : (
                  <FileText size={24} className="text-slate-500" />
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(doc.uploadedAt)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {isImage(doc.type) && (
                    <button
                      onClick={() => setSelectedDoc(doc)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Visualizar"
                    >
                      <Eye size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(doc)}
                    className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Download"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => onRemoveDocument(doc.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Preview de imagem */}
        {selectedDoc && isImage(selectedDoc.type) && (
          <div 
            className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
            onClick={() => setSelectedDoc(null)}
          >
            <div className="max-w-4xl max-h-[90vh]">
              <img 
                src={selectedDoc.data} 
                alt={selectedDoc.name} 
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
              <p className="text-center text-white text-sm mt-2">{selectedDoc.name}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DocumentModal;
