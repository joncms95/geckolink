Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resource :session, only: %i[create destroy], controller: "session"
      resources :registrations, only: %i[create], path: "signup"
      resources :links, only: %i[create index show], param: :key do
        member { get :analytics }
      end
    end
  end

  get ":key", to: "redirects#show", constraints: { key: /[0-9a-zA-Z]+/ }
end
