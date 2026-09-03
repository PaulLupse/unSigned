import React from "react";
import { useParams, Navigate } from 'react-router-dom';
import type {User} from "src/domain/types";

export function MeRedirect({ user }:{user:User|undefined}) {
  // The wildcard match is stored under the '*' key in useParams()
  const { '*': rest } = useParams();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const targetPath = rest ? `/user/${user.username}/${rest}` : `/user/${user.username}`;

  return <Navigate to={targetPath} replace />;
}