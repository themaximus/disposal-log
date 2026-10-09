// DiagramSyncService.js - Сервис синхронизации диаграмм с сервером и LocalStorage
import {
  STARTER_PRESETS,
  getOfflineDiagrams,
  saveOfflineDiagram,
  deleteOfflineDiagram
} from '../utils/diagramStorage';
import { diagramsApi } from '../api';

export class DiagramSyncService {
  /**
   * Загрузка списка схем (с сервера или из оффлайн-хранилища)
   */
  static async loadDiagrams(currentUser) {
    if (currentUser) {
      try {
        const serverDiagrams = await diagramsApi.list();
        if (Array.isArray(serverDiagrams) && serverDiagrams.length > 0) {
          return serverDiagrams.map(d => {
            let parsedData = { nodes: [], edges: [] };
            try {
              parsedData = typeof d.xml === 'string' && d.xml.startsWith('{')
                ? JSON.parse(d.xml)
                : null;
            } catch (e) {
              console.error('Failed to parse diagram XML/JSON:', e);
            }
            return {
              id: d.id,
              title: d.title,
              nodes: parsedData?.nodes || STARTER_PRESETS[0].data.nodes,
              edges: parsedData?.edges || STARTER_PRESETS[0].data.edges,
              created_at: d.created_at,
              updated_at: d.updated_at
            };
          });
        }
      } catch (err) {
        console.error('Error fetching server diagrams, falling back to offline:', err);
      }
    }

    const offline = getOfflineDiagrams();
    return Array.isArray(offline) ? offline : [];
  }

  /**
   * Сохранение схемы (оффлайн + синхронизация на сервер при наличии авторизации)
   */
  static async saveDiagram(diagramId, title, nodes, edges, currentUser) {
    if (!diagramId) return null;

    const updatedDiag = {
      id: diagramId,
      title: title || 'Схема',
      nodes,
      edges,
      updated_at: new Date().toISOString()
    };

    saveOfflineDiagram(updatedDiag);

    if (currentUser && typeof diagramId === 'number') {
      try {
        await diagramsApi.update(diagramId, {
          title: updatedDiag.title,
          xml: JSON.stringify({ nodes, edges })
        });
      } catch (err) {
        console.error('Failed to save diagram to server:', err);
      }
    }

    return updatedDiag;
  }

  /**
   * Создание новой схемы на сервере или локально
   */
  static async createDiagram(title, nodes, edges, currentUser) {
    const finalTitle = (title || '').trim() || 'Новая схема';
    const finalNodes = JSON.parse(JSON.stringify(nodes || []));
    const finalEdges = JSON.parse(JSON.stringify(edges || []));

    if (currentUser) {
      try {
        const created = await diagramsApi.create({
          title: finalTitle,
          xml: JSON.stringify({ nodes: finalNodes, edges: finalEdges })
        });
        return {
          id: created.id,
          title: finalTitle,
          nodes: finalNodes,
          edges: finalEdges,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      } catch (e) {
        console.error('Failed to create server diagram:', e);
      }
    }

    const newLocal = {
      id: 'diag_' + Date.now(),
      title: finalTitle,
      nodes: finalNodes,
      edges: finalEdges,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    saveOfflineDiagram(newLocal);
    return newLocal;
  }

  /**
   * Удаление схемы
   */
  static async deleteDiagram(diagramId, currentUser) {
    deleteOfflineDiagram(diagramId);

    if (currentUser && typeof diagramId === 'number') {
      try {
        await diagramsApi.remove(diagramId);
      } catch (err) {
        console.error('Failed to delete server diagram:', err);
      }
    }
  }
}

export default DiagramSyncService;
