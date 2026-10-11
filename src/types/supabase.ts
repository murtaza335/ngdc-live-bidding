export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string;
          real_name: string;
          track: 'Programmer' | '2D Artist' | '3D Artist' | 'Game Designer';
          score: number;
          media_type: 'video' | 'image' | 'pdf';
          media_url: string;
          pitch: string;
          status: 'available' | 'bidding' | 'drafted';
          drafted_to_house_id: string | null;
          winning_bid: number;
        };
        Insert: {
          id: string;
          real_name: string;
          track: 'Programmer' | '2D Artist' | '3D Artist' | 'Game Designer';
          score: number;
          media_type: 'video' | 'image' | 'pdf';
          media_url: string;
          pitch: string;
          status?: 'available' | 'bidding' | 'drafted';
          drafted_to_house_id?: string | null;
          winning_bid?: number;
        };
        Update: {
          id?: string;
          real_name?: string;
          track?: 'Programmer' | '2D Artist' | '3D Artist' | 'Game Designer';
          score?: number;
          media_type?: 'video' | 'image' | 'pdf';
          media_url?: string;
          pitch?: string;
          status?: 'available' | 'bidding' | 'drafted';
          drafted_to_house_id?: string | null;
          winning_bid?: number;
        };
        Relationships: [
          {
            foreignKeyName: "candidates_drafted_to_house_id_fkey";
            columns: ["drafted_to_house_id"];
            isOneToOne: false;
            referencedRelation: "houses";
            referencedColumns: ["id"];
          }
        ];
      };
      houses: {
        Row: {
          id: string;
          name: string;
          ob_lead: string;
          color_hex: string;
          initial_credits: number;
          remaining_credits: number;
        };
        Insert: {
          id: string;
          name: string;
          ob_lead: string;
          color_hex: string;
          initial_credits?: number;
          remaining_credits?: number;
        };
        Update: {
          id?: string;
          name?: string;
          ob_lead?: string;
          color_hex?: string;
          initial_credits?: number;
          remaining_credits?: number;
        };
        Relationships: [];
      };
      bids_log: {
        Row: {
          id: number;
          candidate_id: string;
          house_id: string;
          bid_amount: number;
          created_at: string;
        };
        Insert: {
          candidate_id: string;
          house_id: string;
          bid_amount: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          candidate_id?: string;
          house_id?: string;
          bid_amount?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bids_log_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bids_log_house_id_fkey";
            columns: ["house_id"];
            isOneToOne: false;
            referencedRelation: "houses";
            referencedColumns: ["id"];
          }
        ];
      };
      settings: {
        Row: {
          key: string;
          value: string;
        };
        Insert: {
          key: string;
          value: string;
        };
        Update: {
          key?: string;
          value?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}