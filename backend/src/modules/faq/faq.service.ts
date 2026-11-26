import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateFaqDto, UpdateFaqDto } from './dto/faq.dto';
import { FaqItem, DEFAULT_FAQS } from './faq.constants';
import { randomUUID } from 'crypto';

@Injectable()
export class FaqService {
  constructor(private readonly db: DatabaseService) {}

  getAllFaqs(publishedOnly = false): FaqItem[] {
    const memory = this.db.getMemoryStore();
    if (!memory.faqs || memory.faqs.size === 0) {
      DEFAULT_FAQS.forEach(f => memory.faqs.set(f.id, { ...f }));
      this.db.persistDevStore();
    }

    let items = Array.from(memory.faqs.values()) as FaqItem[];
    if (publishedOnly) {
      items = items.filter(f => f.is_published);
    }
    return items.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }

  getFaqById(id: string): FaqItem {
    const memory = this.db.getMemoryStore();
    const item = memory.faqs.get(id);
    if (!item) {
      throw new NotFoundException(`FAQ with ID '${id}' not found`);
    }
    return item;
  }

  createFaq(dto: CreateFaqDto): FaqItem {
    const memory = this.db.getMemoryStore();
    const id = `faq-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const maxOrder = Array.from(memory.faqs.values()).reduce((max: number, f: any) => Math.max(max, f.order_index || 0), 0);

    const newItem: FaqItem = {
      id,
      category: dto.category || 'LEVITATION',
      question: (dto.question || '').trim(),
      answer: (dto.answer || '').trim(),
      is_published: dto.is_published !== undefined ? dto.is_published : true,
      order_index: dto.order_index !== undefined ? dto.order_index : maxOrder + 1,
      created_at: now,
      updated_at: now,
    };

    memory.faqs.set(id, newItem);
    this.db.persistDevStore();
    return newItem;
  }

  updateFaq(id: string, dto: UpdateFaqDto): FaqItem {
    const memory = this.db.getMemoryStore();
    const item = memory.faqs.get(id);
    if (!item) {
      throw new NotFoundException(`FAQ with ID '${id}' not found`);
    }

    const updated: FaqItem = {
      ...item,
      question: dto.question !== undefined ? (dto.question || '').trim() : item.question,
      answer: dto.answer !== undefined ? (dto.answer || '').trim() : item.answer,
      category: dto.category !== undefined ? dto.category : item.category,
      is_published: dto.is_published !== undefined ? dto.is_published : item.is_published,
      order_index: dto.order_index !== undefined ? dto.order_index : item.order_index,
      updated_at: new Date().toISOString(),
    };

    memory.faqs.set(id, updated);
    this.db.persistDevStore();
    return updated;
  }

  deleteFaq(id: string): { success: boolean; id: string } {
    const memory = this.db.getMemoryStore();
    if (!memory.faqs.has(id)) {
      throw new NotFoundException(`FAQ with ID '${id}' not found`);
    }
    memory.faqs.delete(id);
    this.db.persistDevStore();
    return { success: true, id };
  }

  togglePublish(id: string): FaqItem {
    const memory = this.db.getMemoryStore();
    const item = memory.faqs.get(id);
    if (!item) {
      throw new NotFoundException(`FAQ with ID '${id}' not found`);
    }
    item.is_published = !item.is_published;
    item.updated_at = new Date().toISOString();
    memory.faqs.set(id, item);
    this.db.persistDevStore();
    return item;
  }

  reorderFaqs(orderedIds: string[]): FaqItem[] {
    const memory = this.db.getMemoryStore();
    orderedIds.forEach((id, index) => {
      const item = memory.faqs.get(id);
      if (item) {
        item.order_index = index + 1;
        item.updated_at = new Date().toISOString();
        memory.faqs.set(id, item);
      }
    });
    this.db.persistDevStore();
    return this.getAllFaqs(false);
  }

  resetToDefaults(): FaqItem[] {
    const memory = this.db.getMemoryStore();
    memory.faqs.clear();
    DEFAULT_FAQS.forEach(f => memory.faqs.set(f.id, { ...f }));
    this.db.persistDevStore();
    return this.getAllFaqs(false);
  }
}
