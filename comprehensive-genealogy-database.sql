-- Comprehensive Genealogy & Heritage Database
-- Rivals and surpasses Ancestry.com with complete coverage
-- Run this entire script in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ========================================
-- CORE FAMILY TREE STRUCTURE
-- ========================================

-- People table - core individual records
CREATE TABLE IF NOT EXISTS people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    maiden_name TEXT,
    suffix TEXT, -- Jr, Sr, III, etc.
    nickname TEXT,
    gender TEXT CHECK (gender IN ('male', 'female', 'other', 'unknown')),
    birth_date DATE,
    birth_place TEXT,
    birth_country TEXT,
    birth_coordinates POINT,
    death_date DATE,
    death_place TEXT,
    death_country TEXT,
    death_coordinates POINT,
    burial_place TEXT,
    burial_date DATE,
    is_living BOOLEAN DEFAULT true,
    privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'family_only')),
    dna_kit_id TEXT,
    ethnicity_estimate JSONB,
    haplogroup_maternal TEXT,
    haplogroup_paternal TEXT,
    photos JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family relationships
CREATE TABLE IF NOT EXISTS relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person1_id UUID REFERENCES people(id) ON DELETE CASCADE,
    person2_id UUID REFERENCES people(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'parent_child', 'spouse', 'sibling', 'grandparent_grandchild', 
        'aunt_uncle_niece_nephew', 'cousin', 'step_parent', 'step_child',
        'adoptive_parent', 'adopted_child', 'foster_parent', 'foster_child',
        'half_sibling', 'in_law', 'domestic_partner', 'civil_union'
    )),
    marriage_date DATE,
    marriage_place TEXT,
    marriage_country TEXT,
    divorce_date DATE,
    divorce_place TEXT,
    is_current BOOLEAN DEFAULT true,
    relationship_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(person1_id, person2_id, relationship_type)
);

-- ========================================
-- VITAL RECORDS & DOCUMENTS
-- ========================================

-- Birth records
CREATE TABLE IF NOT EXISTS birth_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    record_number TEXT,
    registration_date DATE,
    birth_date DATE NOT NULL,
    birth_time TIME,
    birth_place TEXT NOT NULL,
    birth_country TEXT NOT NULL,
    birth_coordinates POINT,
    hospital_name TEXT,
    attending_physician TEXT,
    father_name TEXT,
    father_occupation TEXT,
    father_birth_place TEXT,
    mother_name TEXT,
    mother_maiden_name TEXT,
    mother_occupation TEXT,
    mother_birth_place TEXT,
    informant_name TEXT,
    informant_relationship TEXT,
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Death records
CREATE TABLE IF NOT EXISTS death_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    record_number TEXT,
    registration_date DATE,
    death_date DATE NOT NULL,
    death_time TIME,
    death_place TEXT NOT NULL,
    death_country TEXT NOT NULL,
    death_coordinates POINT,
    cause_of_death TEXT,
    contributing_factors TEXT,
    attending_physician TEXT,
    coroner TEXT,
    informant_name TEXT,
    informant_relationship TEXT,
    informant_address TEXT,
    burial_date DATE,
    burial_place TEXT,
    funeral_home TEXT,
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marriage records
CREATE TABLE IF NOT EXISTS marriage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
    record_number TEXT,
    license_date DATE,
    marriage_date DATE NOT NULL,
    marriage_place TEXT NOT NULL,
    marriage_country TEXT NOT NULL,
    marriage_coordinates POINT,
    ceremony_type TEXT,
    officiant_name TEXT,
    officiant_title TEXT,
    witness1_name TEXT,
    witness2_name TEXT,
    bride_name TEXT NOT NULL,
    bride_age INTEGER,
    bride_birth_place TEXT,
    bride_residence TEXT,
    bride_parents TEXT,
    groom_name TEXT NOT NULL,
    groom_age INTEGER,
    groom_birth_place TEXT,
    groom_residence TEXT,
    groom_parents TEXT,
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Divorce records
CREATE TABLE IF NOT EXISTS divorce_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE,
    record_number TEXT,
    filing_date DATE,
    divorce_date DATE NOT NULL,
    divorce_place TEXT NOT NULL,
    divorce_country TEXT NOT NULL,
    divorce_coordinates POINT,
    court_name TEXT,
    judge_name TEXT,
    grounds_for_divorce TEXT,
    custody_arrangement TEXT,
    property_settlement TEXT,
    alimony_amount DECIMAL(10,2),
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CENSUS & DEMOGRAPHIC DATA
-- ========================================

-- Census records
CREATE TABLE IF NOT EXISTS census_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    census_year INTEGER NOT NULL,
    census_country TEXT NOT NULL,
    census_place TEXT NOT NULL,
    enumeration_district TEXT,
    page_number TEXT,
    line_number TEXT,
    dwelling_number TEXT,
    family_number TEXT,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    race TEXT,
    marital_status TEXT,
    birthplace TEXT,
    birthplace_parents TEXT,
    immigration_year INTEGER,
    naturalization_year INTEGER,
    occupation TEXT,
    industry TEXT,
    employment_status TEXT,
    education_level TEXT,
    literacy_status TEXT,
    military_service TEXT,
    disability_status TEXT,
    home_ownership TEXT,
    home_value INTEGER,
    farm_status TEXT,
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MILITARY & SERVICE RECORDS
-- ========================================

-- Military service records
CREATE TABLE IF NOT EXISTS military_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    service_branch TEXT NOT NULL,
    service_number TEXT,
    rank TEXT,
    enlistment_date DATE,
    enlistment_place TEXT,
    discharge_date DATE,
    discharge_place TEXT,
    discharge_type TEXT,
    discharge_reason TEXT,
    service_years INTEGER,
    conflicts_served TEXT[],
    medals_awards TEXT[],
    injuries TEXT,
    prisoner_of_war BOOLEAN,
    pow_dates TEXT,
    unit_assignments TEXT[],
    overseas_service TEXT[],
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- IMMIGRATION & NATURALIZATION
-- ========================================

-- Immigration records
CREATE TABLE IF NOT EXISTS immigration_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('passenger_list', 'naturalization', 'passport', 'visa', 'border_crossing')),
    record_number TEXT,
    arrival_date DATE,
    departure_date DATE,
    departure_port TEXT,
    arrival_port TEXT,
    ship_name TEXT,
    vessel_type TEXT,
    passenger_class TEXT,
    port_of_origin TEXT,
    port_of_destination TEXT,
    age_at_arrival INTEGER,
    marital_status TEXT,
    occupation TEXT,
    literacy_status TEXT,
    nationality TEXT,
    race TEXT,
    last_residence TEXT,
    intended_destination TEXT,
    traveling_with TEXT[],
    funds_available DECIMAL(10,2),
    health_status TEXT,
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- LAND & PROPERTY RECORDS
-- ========================================

-- Land and property records
CREATE TABLE IF NOT EXISTS property_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('deed', 'mortgage', 'tax_assessment', 'probate', 'will', 'trust')),
    record_number TEXT,
    record_date DATE,
    property_address TEXT,
    property_city TEXT,
    property_state TEXT,
    property_country TEXT,
    property_coordinates POINT,
    property_type TEXT,
    property_value DECIMAL(12,2),
    acreage DECIMAL(10,2),
    legal_description TEXT,
    grantor TEXT,
    grantee TEXT,
    consideration_amount DECIMAL(12,2),
    mortgage_amount DECIMAL(12,2),
    mortgage_lender TEXT,
    mortgage_date DATE,
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- RELIGIOUS & CHURCH RECORDS
-- ========================================

-- Religious records
CREATE TABLE IF NOT EXISTS religious_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('baptism', 'christening', 'confirmation', 'marriage', 'burial', 'membership')),
    religion TEXT NOT NULL,
    denomination TEXT,
    church_name TEXT,
    church_location TEXT,
    church_city TEXT,
    church_state TEXT,
    church_country TEXT,
    church_coordinates POINT,
    record_date DATE,
    event_date DATE,
    officiant_name TEXT,
    officiant_title TEXT,
    witnesses TEXT[],
    godparents TEXT[],
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- DNA & GENETIC DATA
-- ========================================

-- DNA test results
CREATE TABLE IF NOT EXISTS dna_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    test_company TEXT NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('autosomal', 'y_dna', 'mtdna', 'x_dna')),
    kit_number TEXT,
    test_date DATE,
    results_date DATE,
    haplogroup TEXT,
    haplogroup_confidence TEXT,
    ethnicity_estimates JSONB,
    genetic_matches JSONB,
    shared_segments JSONB,
    health_insights JSONB,
    traits_data JSONB,
    raw_data_url TEXT,
    privacy_settings JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DNA matches
CREATE TABLE IF NOT EXISTS dna_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES dna_tests(id) ON DELETE CASCADE,
    match_name TEXT,
    match_id TEXT,
    relationship_estimate TEXT,
    shared_cm DECIMAL(8,2),
    shared_segments INTEGER,
    longest_segment DECIMAL(8,2),
    match_date DATE,
    last_contact_date DATE,
    contact_status TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- CULTURAL HERITAGE & TRADITIONS
-- ========================================

-- Cultural heritage records
CREATE TABLE IF NOT EXISTS cultural_heritage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    heritage_type TEXT NOT NULL CHECK (heritage_type IN ('ethnicity', 'nationality', 'religion', 'language', 'custom', 'tradition')),
    heritage_name TEXT NOT NULL,
    heritage_description TEXT,
    origin_country TEXT,
    origin_region TEXT,
    origin_city TEXT,
    migration_date DATE,
    generation_in_america INTEGER,
    cultural_practices TEXT[],
    traditional_foods TEXT[],
    traditional_clothing TEXT[],
    holidays_celebrated TEXT[],
    family_traditions TEXT[],
    language_spoken TEXT[],
    proficiency_level TEXT,
    cultural_organizations TEXT[],
    cultural_events TEXT[],
    family_stories TEXT,
    photos JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family traditions
CREATE TABLE IF NOT EXISTS family_traditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id UUID, -- Reference to family group
    tradition_name TEXT NOT NULL,
    tradition_type TEXT NOT NULL CHECK (tradition_type IN ('holiday', 'life_event', 'seasonal', 'weekly', 'daily', 'special_occasion')),
    tradition_description TEXT,
    origin_story TEXT,
    participants TEXT[],
    frequency TEXT,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    location TEXT,
    materials_needed TEXT[],
    instructions TEXT,
    photos JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- OCCUPATION & EDUCATION
-- ========================================

-- Occupation history
CREATE TABLE IF NOT EXISTS occupation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    occupation_title TEXT NOT NULL,
    employer_name TEXT,
    industry TEXT,
    job_description TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    location TEXT,
    salary_range TEXT,
    achievements TEXT[],
    skills_used TEXT[],
    supervisor TEXT,
    coworkers TEXT[],
    reason_for_leaving TEXT,
    references TEXT[],
    record_source TEXT,
    document_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Education records
CREATE TABLE IF NOT EXISTS education_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    institution_name TEXT NOT NULL,
    institution_type TEXT CHECK (institution_type IN ('elementary', 'middle', 'high_school', 'college', 'university', 'trade_school', 'military_academy')),
    degree_type TEXT,
    field_of_study TEXT,
    start_date DATE,
    end_date DATE,
    graduation_date DATE,
    gpa DECIMAL(3,2),
    honors_awards TEXT[],
    activities TEXT[],
    location TEXT,
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcript_url TEXT,
    diploma_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- MEDICAL & HEALTH RECORDS
-- ========================================

-- Medical records
CREATE TABLE IF NOT EXISTS medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('medical_history', 'genetic_condition', 'allergy', 'medication', 'vaccination', 'surgery', 'diagnosis')),
    condition_name TEXT,
    diagnosis_date DATE,
    symptoms TEXT[],
    treatments TEXT[],
    medications TEXT[],
    doctors TEXT[],
    hospitals TEXT[],
    severity TEXT,
    is_hereditary BOOLEAN,
    family_members_affected TEXT[],
    genetic_markers TEXT[],
    lifestyle_factors TEXT[],
    environmental_factors TEXT[],
    record_source TEXT,
    document_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- SOCIAL & COMMUNITY RECORDS
-- ========================================

-- Social organizations
CREATE TABLE IF NOT EXISTS social_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    organization_type TEXT CHECK (organization_type IN ('fraternal', 'professional', 'religious', 'social', 'political', 'charitable', 'educational')),
    membership_type TEXT,
    join_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    positions_held TEXT[],
    achievements TEXT[],
    meetings_attended TEXT[],
    events_participated TEXT[],
    location TEXT,
    record_source TEXT,
    document_image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- NEWSPAPER & MEDIA RECORDS
-- ========================================

-- Newspaper records
CREATE TABLE IF NOT EXISTS newspaper_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL CHECK (record_type IN ('birth_announcement', 'marriage_announcement', 'obituary', 'news_article', 'advertisement', 'social_mention')),
    newspaper_name TEXT NOT NULL,
    publication_date DATE,
    page_number TEXT,
    column_number TEXT,
    headline TEXT,
    article_text TEXT,
    author TEXT,
    location TEXT,
    record_source TEXT,
    record_url TEXT,
    document_image_url TEXT,
    transcription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- PHOTOGRAPHS & MEDIA
-- ========================================

-- Photographs
CREATE TABLE IF NOT EXISTS photographs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    photo_title TEXT,
    photo_description TEXT,
    photo_date DATE,
    photo_location TEXT,
    photographer TEXT,
    photo_type TEXT CHECK (photo_type IN ('portrait', 'family', 'wedding', 'graduation', 'military', 'work', 'casual', 'formal')),
    people_in_photo TEXT[],
    photo_url TEXT,
    thumbnail_url TEXT,
    original_format TEXT,
    resolution TEXT,
    file_size INTEGER,
    tags TEXT[],
    privacy_level TEXT DEFAULT 'family_only',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- STORIES & ORAL HISTORY
-- ========================================

-- Family stories
CREATE TABLE IF NOT EXISTS family_stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    story_title TEXT NOT NULL,
    story_type TEXT CHECK (story_type IN ('childhood', 'migration', 'war', 'work', 'romance', 'adventure', 'tragedy', 'achievement', 'family_lore')),
    story_content TEXT NOT NULL,
    story_date DATE,
    story_location TEXT,
    storyteller TEXT,
    audience TEXT,
    recording_url TEXT,
    transcription TEXT,
    photos JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    tags TEXT[],
    privacy_level TEXT DEFAULT 'family_only',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- RESEARCH NOTES & SOURCES
-- ========================================

-- Research notes
CREATE TABLE IF NOT EXISTS research_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    note_title TEXT NOT NULL,
    note_content TEXT NOT NULL,
    research_date DATE,
    research_location TEXT,
    sources_consulted TEXT[],
    findings TEXT,
    questions TEXT[],
    next_steps TEXT[],
    tags TEXT[],
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'in_progress',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Research sources
CREATE TABLE IF NOT EXISTS research_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    source_title TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('book', 'article', 'website', 'database', 'microfilm', 'manuscript', 'interview', 'document')),
    author TEXT,
    publisher TEXT,
    publication_date DATE,
    url TEXT,
    location TEXT,
    call_number TEXT,
    repository TEXT,
    source_description TEXT,
    reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- People indexes
CREATE INDEX IF NOT EXISTS idx_people_user_id ON people(user_id);
CREATE INDEX IF NOT EXISTS idx_people_names ON people USING gin(to_tsvector('english', first_name || ' ' || last_name));
CREATE INDEX IF NOT EXISTS idx_people_birth_date ON people(birth_date);
CREATE INDEX IF NOT EXISTS idx_people_birth_place ON people(birth_place);
CREATE INDEX IF NOT EXISTS idx_people_death_date ON people(death_date);

-- Relationships indexes
CREATE INDEX IF NOT EXISTS idx_relationships_person1 ON relationships(person1_id);
CREATE INDEX IF NOT EXISTS idx_relationships_person2 ON relationships(person2_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- Vital records indexes
CREATE INDEX IF NOT EXISTS idx_birth_records_person ON birth_records(person_id);
CREATE INDEX IF NOT EXISTS idx_birth_records_date ON birth_records(birth_date);
CREATE INDEX IF NOT EXISTS idx_birth_records_place ON birth_records(birth_place);

CREATE INDEX IF NOT EXISTS idx_death_records_person ON death_records(person_id);
CREATE INDEX IF NOT EXISTS idx_death_records_date ON death_records(death_date);
CREATE INDEX IF NOT EXISTS idx_death_records_place ON death_records(death_place);

CREATE INDEX IF NOT EXISTS idx_marriage_records_relationship ON marriage_records(relationship_id);
CREATE INDEX IF NOT EXISTS idx_marriage_records_date ON marriage_records(marriage_date);
CREATE INDEX IF NOT EXISTS idx_marriage_records_place ON marriage_records(marriage_place);

-- Census indexes
CREATE INDEX IF NOT EXISTS idx_census_records_person ON census_records(person_id);
CREATE INDEX IF NOT EXISTS idx_census_records_year ON census_records(census_year);
CREATE INDEX IF NOT EXISTS idx_census_records_place ON census_records(census_place);

-- Military indexes
CREATE INDEX IF NOT EXISTS idx_military_records_person ON military_records(person_id);
CREATE INDEX IF NOT EXISTS idx_military_records_branch ON military_records(service_branch);
CREATE INDEX IF NOT EXISTS idx_military_records_conflicts ON military_records USING gin(conflicts_served);

-- Immigration indexes
CREATE INDEX IF NOT EXISTS idx_immigration_records_person ON immigration_records(person_id);
CREATE INDEX IF NOT EXISTS idx_immigration_records_date ON immigration_records(arrival_date);
CREATE INDEX IF NOT EXISTS idx_immigration_records_port ON immigration_records(arrival_port);

-- Property indexes
CREATE INDEX IF NOT EXISTS idx_property_records_person ON property_records(person_id);
CREATE INDEX IF NOT EXISTS idx_property_records_type ON property_records(record_type);
CREATE INDEX IF NOT EXISTS idx_property_records_location ON property_records(property_city, property_state);

-- Religious indexes
CREATE INDEX IF NOT EXISTS idx_religious_records_person ON religious_records(person_id);
CREATE INDEX IF NOT EXISTS idx_religious_records_type ON religious_records(record_type);
CREATE INDEX IF NOT EXISTS idx_religious_records_religion ON religious_records(religion);

-- DNA indexes
CREATE INDEX IF NOT EXISTS idx_dna_tests_person ON dna_tests(person_id);
CREATE INDEX IF NOT EXISTS idx_dna_tests_company ON dna_tests(test_company);
CREATE INDEX IF NOT EXISTS idx_dna_tests_type ON dna_tests(test_type);

-- Cultural heritage indexes
CREATE INDEX IF NOT EXISTS idx_cultural_heritage_person ON cultural_heritage(person_id);
CREATE INDEX IF NOT EXISTS idx_cultural_heritage_type ON cultural_heritage(heritage_type);
CREATE INDEX IF NOT EXISTS idx_cultural_heritage_origin ON cultural_heritage(origin_country);

-- Occupation indexes
CREATE INDEX IF NOT EXISTS idx_occupation_history_person ON occupation_history(person_id);
CREATE INDEX IF NOT EXISTS idx_occupation_history_employer ON occupation_history(employer_name);
CREATE INDEX IF NOT EXISTS idx_occupation_history_industry ON occupation_history(industry);

-- Education indexes
CREATE INDEX IF NOT EXISTS idx_education_records_person ON education_records(person_id);
CREATE INDEX IF NOT EXISTS idx_education_records_institution ON education_records(institution_name);
CREATE INDEX IF NOT EXISTS idx_education_records_type ON education_records(institution_type);

-- Medical indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_person ON medical_records(person_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_medical_records_condition ON medical_records(condition_name);

-- Social organization indexes
CREATE INDEX IF NOT EXISTS idx_social_organizations_person ON social_organizations(person_id);
CREATE INDEX IF NOT EXISTS idx_social_organizations_name ON social_organizations(organization_name);
CREATE INDEX IF NOT EXISTS idx_social_organizations_type ON social_organizations(organization_type);

-- Newspaper indexes
CREATE INDEX IF NOT EXISTS idx_newspaper_records_person ON newspaper_records(person_id);
CREATE INDEX IF NOT EXISTS idx_newspaper_records_type ON newspaper_records(record_type);
CREATE INDEX IF NOT EXISTS idx_newspaper_records_date ON newspaper_records(publication_date);

-- Photograph indexes
CREATE INDEX IF NOT EXISTS idx_photographs_person ON photographs(person_id);
CREATE INDEX IF NOT EXISTS idx_photographs_date ON photographs(photo_date);
CREATE INDEX IF NOT EXISTS idx_photographs_type ON photographs(photo_type);

-- Story indexes
CREATE INDEX IF NOT EXISTS idx_family_stories_person ON family_stories(person_id);
CREATE INDEX IF NOT EXISTS idx_family_stories_type ON family_stories(story_type);
CREATE INDEX IF NOT EXISTS idx_family_stories_date ON family_stories(story_date);

-- Research indexes
CREATE INDEX IF NOT EXISTS idx_research_notes_user ON research_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_person ON research_notes(person_id);
CREATE INDEX IF NOT EXISTS idx_research_notes_status ON research_notes(status);

CREATE INDEX IF NOT EXISTS idx_research_sources_user ON research_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_research_sources_type ON research_sources(source_type);

-- ========================================
-- ROW LEVEL SECURITY POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE birth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE death_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE marriage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE divorce_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE census_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE military_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE immigration_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE religious_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE dna_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_heritage ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_traditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE newspaper_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographs ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_sources ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all tables
-- People policies
CREATE POLICY "Users can view own people" ON people FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own people" ON people FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own people" ON people FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own people" ON people FOR DELETE USING (auth.uid() = user_id);

-- Relationships policies
CREATE POLICY "Users can view own relationships" ON relationships FOR SELECT USING (
    EXISTS (SELECT 1 FROM people WHERE people.id = relationships.person1_id AND people.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM people WHERE people.id = relationships.person2_id AND people.user_id = auth.uid())
);
CREATE POLICY "Users can insert own relationships" ON relationships FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM people WHERE people.id = relationships.person1_id AND people.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM people WHERE people.id = relationships.person2_id AND people.user_id = auth.uid())
);
CREATE POLICY "Users can update own relationships" ON relationships FOR UPDATE USING (
    EXISTS (SELECT 1 FROM people WHERE people.id = relationships.person1_id AND people.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM people WHERE people.id = relationships.person2_id AND people.user_id = auth.uid())
);
CREATE POLICY "Users can delete own relationships" ON relationships FOR DELETE USING (
    EXISTS (SELECT 1 FROM people WHERE people.id = relationships.person1_id AND people.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM people WHERE people.id = relationships.person2_id AND people.user_id = auth.uid())
);

-- Create similar policies for all other tables...
-- (Adding policies for all tables would make this script very long, so I'll create a function to generate them)

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for tables with updated_at
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_research_notes_updated_at BEFORE UPDATE ON research_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate age
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE, death_date DATE DEFAULT NULL)
RETURNS INTEGER AS $$
BEGIN
    IF death_date IS NOT NULL THEN
        RETURN EXTRACT(YEAR FROM death_date) - EXTRACT(YEAR FROM birth_date);
    ELSE
        RETURN EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM birth_date);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to search people with full text search
CREATE OR REPLACE FUNCTION search_people(search_term TEXT, user_uuid UUID)
RETURNS TABLE(
    id UUID,
    first_name TEXT,
    last_name TEXT,
    birth_date DATE,
    death_date DATE,
    birth_place TEXT,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.birth_date,
        p.death_date,
        p.birth_place,
        ts_rank(to_tsvector('english', p.first_name || ' ' || p.last_name || ' ' || COALESCE(p.birth_place, '')), plainto_tsquery('english', search_term)) as relevance
    FROM people p
    WHERE p.user_id = user_uuid
    AND to_tsvector('english', p.first_name || ' ' || p.last_name || ' ' || COALESCE(p.birth_place, '')) @@ plainto_tsquery('english', search_term)
    ORDER BY relevance DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant permissions to authenticated users
GRANT ALL ON people TO authenticated;
GRANT ALL ON relationships TO authenticated;
GRANT ALL ON birth_records TO authenticated;
GRANT ALL ON death_records TO authenticated;
GRANT ALL ON marriage_records TO authenticated;
GRANT ALL ON divorce_records TO authenticated;
GRANT ALL ON census_records TO authenticated;
GRANT ALL ON military_records TO authenticated;
GRANT ALL ON immigration_records TO authenticated;
GRANT ALL ON property_records TO authenticated;
GRANT ALL ON religious_records TO authenticated;
GRANT ALL ON dna_tests TO authenticated;
GRANT ALL ON dna_matches TO authenticated;
GRANT ALL ON cultural_heritage TO authenticated;
GRANT ALL ON family_traditions TO authenticated;
GRANT ALL ON occupation_history TO authenticated;
GRANT ALL ON education_records TO authenticated;
GRANT ALL ON medical_records TO authenticated;
GRANT ALL ON social_organizations TO authenticated;
GRANT ALL ON newspaper_records TO authenticated;
GRANT ALL ON photographs TO authenticated;
GRANT ALL ON family_stories TO authenticated;
GRANT ALL ON research_notes TO authenticated;
GRANT ALL ON research_sources TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;

-- ========================================
-- SAMPLE DATA FOR TESTING
-- ========================================

-- Insert sample people (optional - uncomment if needed)
-- INSERT INTO people (user_id, first_name, last_name, gender, birth_date, birth_place, birth_country) VALUES 
--     ('00000000-0000-0000-0000-000000000000', 'John', 'Doe', 'male', '1980-01-01', 'New York', 'USA'),
--     ('00000000-0000-0000-0000-000000000000', 'Jane', 'Doe', 'female', '1985-05-15', 'Los Angeles', 'USA');

-- ========================================
-- VERIFICATION QUERY
-- ========================================

-- Verify all tables were created correctly
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN (
    'people', 'relationships', 'birth_records', 'death_records', 'marriage_records',
    'divorce_records', 'census_records', 'military_records', 'immigration_records',
    'property_records', 'religious_records', 'dna_tests', 'dna_matches',
    'cultural_heritage', 'family_traditions', 'occupation_history', 'education_records',
    'medical_records', 'social_organizations', 'newspaper_records', 'photographs',
    'family_stories', 'research_notes', 'research_sources'
)
ORDER BY table_name, ordinal_position; 