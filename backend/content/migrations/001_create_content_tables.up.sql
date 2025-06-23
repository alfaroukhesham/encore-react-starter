CREATE TYPE content_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE content_type AS ENUM ('article', 'page', 'blog_post');

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    status content_status DEFAULT 'draft',
    type content_type DEFAULT 'article',
    author_id UUID NOT NULL,
    category_id UUID REFERENCES categories(id),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE content_tags (
    content_id UUID REFERENCES content_items(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, tag_id)
);

CREATE INDEX idx_content_items_author_id ON content_items(author_id);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_content_items_type ON content_items(type);
CREATE INDEX idx_content_items_slug ON content_items(slug);
CREATE INDEX idx_categories_slug ON categories(slug); 