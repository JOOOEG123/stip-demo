import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  TemplateRef,
} from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { ArchieveApiService } from 'src/app/core/services/archives-api-service';
import { AuthServiceService } from 'src/app/core/services/auth-service.service';
import { Image } from 'src/app/core/types/adminpage.types';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
})
export class OverlayComponent implements OnInit {
  @Input() status?: string;
  @Input() image?: Image;
  @Input() otherImage?: Image;
  @Output() close: EventEmitter<any> = new EventEmitter();
  @Output() submit: EventEmitter<any> = new EventEmitter();
  @Output() update: EventEmitter<any> = new EventEmitter();
  @Output() cancel: EventEmitter<any> = new EventEmitter();
  @Output() delete: EventEmitter<any> = new EventEmitter();
  @Output() remove: EventEmitter<any> = new EventEmitter();

  otherLanguage?: string;
  modalRef?: BsModalRef;

  constructor(private auth: AuthServiceService) {}

  isAdmin: boolean = false;
  isEditMode: boolean = false;

  category: string = '';
  title: string = '';
  detail: string = '';
  source: string = '';

  otherCategory: string = '';
  otherTitle: string = '';
  otherDetail: string = '';
  otherSource: string = '';

  ngOnInit(): void {
    this.auth.isAdmin.subscribe((isAdmin) => {
      this.isAdmin = isAdmin;
    });
    this.otherLanguage = 'Chinese';
  }

  onClose() {
    this.close.emit({
      status: 'close',
    });
  }

  onEdit() {
    this.isEditMode = true;

    this.category = this.image!.galleryCategory;
    this.title = this.image!.galleryTitle;
    this.detail = this.image!.galleryDetail;
    this.source = this.image!.gallerySource;

    // Fetch the image in other language
    this.otherImage = {
      ...this.image!,
      galleryCategory: '类别',
      galleryTitle: '标题',
      galleryDetail: '细节',
      gallerySource: '资源',
    };

    this.otherCategory = this.otherImage?.galleryCategory;
    this.otherTitle = this.otherImage?.galleryTitle;
    this.otherDetail = this.otherImage?.galleryDetail;
    this.otherSource = this.otherImage?.gallerySource;
  }

  onSubmit() {
    this.submit.emit({
      image: {
        ...this.image,
        galleryCategory: this.category,
        galleryTitle: this.title,
        galleryDetail: this.detail,
        gallerySource: this.source,
      },
      otherImage: {
        ...this.otherImage,
        galleryCategory: this.otherCategory,
        galleryTitle: this.otherTitle,
        galleryDetail: this.otherDetail,
        gallerySource: this.otherSource,
      },
      status: 'submit',
    });
  }

  onRemove() {
    this.remove.emit({
      status: 'remove',
    });
  }

  onUpdate() {
    this.update.emit({
      image: this.image,
      otherImage: this.otherImage,
      status: 'update',
    });
  }

  onDelete() {
    this.delete.emit({
      image: this.image,
      status: 'delete',
    });
  }

  onCancel() {
    this.cancel.emit({
      status: 'cancel',
    });
  }
}
