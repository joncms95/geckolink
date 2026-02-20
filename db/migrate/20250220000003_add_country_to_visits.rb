# frozen_string_literal: true

class AddCountryToVisits < ActiveRecord::Migration[7.2]
  def change
    add_column :visits, :country, :string
    add_index :visits, :country
  end
end
