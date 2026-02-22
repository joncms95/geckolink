Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resource :session, only: %i[create destroy], controller: "session"
      resources :registrations, only: %i[create], path: "signup"
      get "me/links", to: "links#my_index"
      resources :links, only: %i[create index show], param: :short_code do
        member { get :analytics }
      end
    end
  end

  get ":short_code", to: "redirects#show", constraints: { short_code: /[0-9a-zA-Z]+/ }
end
