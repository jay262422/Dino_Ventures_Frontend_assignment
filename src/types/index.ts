export interface Category {
  slug: string;
  name: string;
  iconUrl: string;
}

export interface VideoContent {
  title: string;
  mediaUrl: string;
  mediaType: "YOUTUBE" | "MP4";
  thumbnailUrl: string;
  slug: string;
  duration?: string; // Optional - not in dataset, we use placeholder or fetch
}

export interface CategoryWithContents {
  category: Category;
  contents: VideoContent[];
}

export interface VideoData {
  categories: CategoryWithContents[];
}
