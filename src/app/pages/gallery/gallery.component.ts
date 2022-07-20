import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  TemplateRef,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  PageChangedEvent,
  PaginationComponent,
} from 'ngx-bootstrap/pagination';
import { NgxMasonryComponent, NgxMasonryOptions } from 'ngx-masonry';
import { Subscription } from 'rxjs';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Image } from 'src/app/core/types/adminpage.types';

import { ImagesService } from 'src/app/core/services/images.service';
import { StorageApIService } from 'src/app/core/services/storage-api.service';
import { UUID } from 'src/app/core/utils/uuid';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent implements OnInit, OnDestroy {
  selectedCategory?: string;
  currentImageIndex?: number;

  title?: string;
  galleries: string[] = [];
  imageButton?: string;

  public masonryOptions: NgxMasonryOptions = {
    gutter: 20,
  };

  images: Image[] = [];
  categoryImages: Image[] = [];
  searchImages: Image[] = [];
  display: Image[] = [];

  translationSubscription?: Subscription;
  imageSubscription?: Subscription;

  currentPage: number = 1;
  showBoundaryLinks: boolean = true;
  itemsPerPage: number = 6;

  modalRef?: BsModalRef;
  selectedImage?: Image;
  otherImage?: Image;

  status: string = 'initial';

  @ViewChild('image') imageRef?: ElementRef;
  @ViewChild(NgxMasonryComponent) masonry?: NgxMasonryComponent;

  constructor(
    private translate: TranslateService,
    private storageAPI: StorageApIService,
    private imagesAPI: ImagesService,
    private modalService: BsModalService
  ) {}

  ngOnInit(): void {
    this.imageSubscription = this.imagesAPI
      .getAllImages()
      .subscribe((data: any) => {
        this.categoryImages.length = 0;
        this.display.length = 0;
        this.images.length = 0;
        let images: Image[] = Object.values(data);
        for (const image of images) {
          this.storageAPI
            .getGalleryImageURL(`${image.imageId}`)
            .subscribe((data) => {
              image.imagePath = data;
            });
          this.images.push(image);
          if (this.display.length < this.itemsPerPage) {
            this.display.push(image);
          }
        }
        this.categoryImages = this.images.slice();
        this.searchImages = this.categoryImages;
      });

    this.selectedCategory = 'All';
    this.currentImageIndex = -1;

    // Translation
    this.translationSubscription = this.translate
      .stream('gallery')
      .subscribe((data) => {
        this.galleries.length = 0;

        this.galleries.push(data['gallery_top_cat_one_button']);
        this.galleries.push(data['gallery_top_cat_two_button']);
        this.galleries.push(data['gallery_top_cat_three_button']);
        this.galleries.push(data['gallery_top_cat_four_button']);
        this.galleries.push(data['gallery_top_cat_five_button']);
        this.title = data['gallery_top_title'];
        this.imageButton = data['gallery_image_button'];
      });
  }

  ngOnDestroy(): void {
    this.translationSubscription?.unsubscribe();
    this.imageSubscription?.unsubscribe();
  }

  setActive(gallery: string) {
    this.selectedCategory = gallery;

    let result: Image[] = [];

    if (gallery == 'All') {
      result = this.images.slice();
    } else {
      for (const image of this.images) {
        if (image.galleryCategory == gallery) {
          result.push(image);
        }
      }
    }

    this.currentPage = 1;

    // issue with ngx pagination (can only update one field at a time)
    setTimeout(() => {
      this.categoryImages = result;
      this.searchGallery();
      // this.display = this.searchImages.slice(0, this.itemsPerPage)
    }, 100);
  }

  onEnter(index: number) {
    this.currentImageIndex = index;
  }

  onLeave() {
    this.currentImageIndex = -1;
  }

  pageChanged(event: PageChangedEvent): void {
    this.currentPage = event.page;
    var start = (this.currentPage - 1) * this.itemsPerPage;
    var end = start + this.itemsPerPage;
    this.display = this.searchImages.slice(start, end);
    window.scroll(0, 0);
    this.imageRef?.nativeElement.focus();
  }

  onLearnMore(template: TemplateRef<any>, image: Image) {
    this.selectedImage = image;
    this.status = 'initial';
    this.modalService.show(template, { class: 'modal-xl', backdrop: 'static' });
  }

  // functionality in modal
  onSubmit(data: any, template: TemplateRef<any>) {
    this.modalService.hide();

    setTimeout(() => {
      this.status = data.status;
      this.selectedImage = data.image;
      this.otherImage = data.otherImage;
      this.modalService.show(template, {
        class: 'modal-xl',
        backdrop: 'static',
      });
    }, 500);
  }

  onRemove(data: any, template: TemplateRef<any>) {
    this.modalService.hide();

    setTimeout(() => {
      this.status = data.status;
      this.modalService.show(template, {
        class: 'modal-xl',
        backdrop: 'static',
      });
    }, 500);
  }

  onUpdate(data: any) {
    let image: Image = data.image;
    let otherImage: Image = data.otherImage;
    if (this.selectedImage) {
      if (data.status == 'update') {
        this.modalService.hide();
        let { opacity, imagePath, ...result } = image;
        console.log(result);
        this.imagesAPI.updateImage(result);
      }
    }

    if (this.otherImage) {
      if (data.status == 'update') {
        this.modalService.hide();
        let { opacity, imagePath, ...result } = otherImage;
        console.log(result);
        // this.imagesAPI.updateImage(result)
      }
    }
    this.currentPage = 1;
  }

  onDelete(data: any) {
    let image = data.image;
    if (data.status == 'delete') {
      this.modalService.hide();
      this.imagesAPI.deleteImage(image.imageId);
      this.storageAPI.removeGalleryImage(image.imageId);
      console.log(image);
    }
    this.currentPage = 1;
  }

  onCancel(data: any) {
    if (data.status == 'cancel') {
      this.modalService.hide();
    }
  }

  onClose(data: any) {
    if (data.status === 'close') {
      this.modalService.hide();
    }
  }
  searchTerm?: string;

  searchGallery() {
    let result: Image[] = [];

    if (this.searchTerm) {
      for (const image of this.categoryImages) {
        if (
          image.galleryDetail
            .toLowerCase()
            .includes(this.searchTerm.toLowerCase())
        ) {
          result.push(image);
        }
      }
      this.searchImages = result;
      console.log(this.searchImages);
    } else {
      this.searchImages = this.categoryImages;
    }

    this.display = this.searchImages.slice(0, this.itemsPerPage);

    // issue with pagination. Unable to find fix.
    setTimeout(() => {
      this.currentPage = 1;
      this.masonry?.reloadItems();
      this.masonry?.layout();
    }, 200);
  }

  // populateData() {
  // for (let i = 1; i <= 11; i++) {
  //   fetch(`http://localhost:4200/assets/gallery/historical_${i}.jpg`)
  //   .then(async response => {
  //     const contentType = response.headers.get('content-type')
  //     const blob = await response.blob()
  //     const file = new File([blob], UUID(), { type: contentType! })

  //     const uid = UUID()

  //     let image : ImageSchema = {
  //       imageId: uid,
  //       rightistId: '',
  //       isGallery: true,
  //       galleryCategory: '',
  //       galleryTitle: 'Title',
  //       galleryDetail: 'Detail',
  //       gallerySource: 'Source'
  //     }

  //     if (i % 2 == 0) {
  //       image.galleryCategory = 'Camps'
  //     }
  //     else {
  //       image.galleryCategory = 'People'
  //     }

  //     this.imagesAPI.addImage(image)
  //     this.storageAPI.uploadGalleryImage(uid, file)
  //   })
  // }
  // }
}
