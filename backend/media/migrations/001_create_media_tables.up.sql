CREATE TYPE media_type AS ENUM ('image', 'video', 'document', 'audio');

CREATE TABLE media_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    type media_type NOT NULL,
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- for video/audio in seconds
    alt_text TEXT,
    caption TEXT,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE media_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES media_folders(id),
    created_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE media_folder_items (
    media_id UUID REFERENCES media_items(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
    PRIMARY KEY (media_id, folder_id)
);

CREATE INDEX idx_media_items_uploaded_by ON media_items(uploaded_by);
CREATE INDEX idx_media_items_type ON media_items(type);
CREATE INDEX idx_media_items_filename ON media_items(filename);
CREATE INDEX idx_media_folders_parent_id ON media_folders(parent_id); 